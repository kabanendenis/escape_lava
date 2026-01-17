import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, FLOOR_HEIGHT, PLAYER } from '../config';
import { DifficultySettings, LevelPattern, PatternElement } from '../types';
import { clamp, lerp, randomInt, weightedRandom } from '../utils';
import { allPatterns } from '../../level_patterns';
import {
  calculateJumpArc,
  canReachPlatform,
  canReachWithJump,
  jumpArcBlockedBy,
  Platform as JumpPlatform,
} from './JumpPhysics';

/**
 * Level Generator - path-first with physics validation
 *
 * Core goals:
 * - Always maintain a reachable "main path"
 * - Prevent new platforms from blocking that path
 * - Add optional side platforms/patterns that don't interfere
 */

const PLAYER_HEIGHT = PLAYER.HEIGHT;
const PLAYER_WIDTH = PLAYER.WIDTH;

const MIN_VERTICAL_GAP = PLAYER_HEIGHT + TILE_SIZE;
const MIN_PATH_STEP = MIN_VERTICAL_GAP;
const MAX_PATH_STEP = Math.round(
  Math.max(MIN_PATH_STEP + 8, PLAYER.MAX_JUMP_HEIGHT - TILE_SIZE * 0.25)
);
const EDGE_BUFFER = TILE_SIZE;
const HORIZONTAL_CLEARANCE = Math.round(PLAYER_WIDTH * 1.1);
const MAX_PLATFORM_HISTORY = 32;
const MAX_PATH_HISTORY = 24;
const MAX_PATH_ATTEMPTS = 40;
const MAX_DECOR_ATTEMPTS = 16;
const PATTERN_CHANCE = 0.12;
const BASE_LADDER_CHANCE = 0.55;
const MIN_LADDER_CHANCE = 0.3;
const COIN_CHANCE = 0.35;
const PORTAL_CHANCE = 0.08;

// Anti-clustering constants
const MIN_DECOR_VERTICAL_GAP = TILE_SIZE * 2.5;
const MIN_DECOR_HORIZONTAL_GAP = TILE_SIZE * 3;
const MAX_PLATFORMS_IN_REGION = 4;
const REGION_CHECK_HEIGHT = FLOOR_HEIGHT * 1.5;

type PlacedPlatform = JumpPlatform;

export class LevelGenerator {
  private scene: Phaser.Scene;
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private ladders: Phaser.Physics.Arcade.StaticGroup;
  private portals: Phaser.Physics.Arcade.Group;
  private heartPickups: Phaser.Physics.Arcade.Group;
  private coins: Phaser.Physics.Arcade.Group;
  private difficultySettings: DifficultySettings;

  private generatedHeight = 0;
  private lastPlatformX = GAME_WIDTH / 2;
  private lastPlatformY = GAME_HEIGHT;
  private lastPlatformWidth = 3;
  private recentPlatforms: PlacedPlatform[] = [];
  private pathPlatforms: PlacedPlatform[] = [];
  private pathDirection = 1;

  constructor(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    ladders: Phaser.Physics.Arcade.StaticGroup,
    portals: Phaser.Physics.Arcade.Group,
    heartPickups: Phaser.Physics.Arcade.Group,
    coins: Phaser.Physics.Arcade.Group,
    difficultySettings: DifficultySettings
  ) {
    this.scene = scene;
    this.platforms = platforms;
    this.ladders = ladders;
    this.portals = portals;
    this.heartPickups = heartPickups;
    this.coins = coins;
    this.difficultySettings = difficultySettings;
  }

  generateInitialLevel(): void {
    this.createStartingArea();

    const initialHeight = GAME_HEIGHT + FLOOR_HEIGHT * 3;
    while (this.generatedHeight < initialHeight) {
      this.generateNextSection();
    }
  }

  private createStartingArea(): void {
    const groundY = GAME_HEIGHT - TILE_SIZE / 2;
    for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
      this.addPlatform(x + TILE_SIZE / 2, groundY, 1);
    }

    const firstY = GAME_HEIGHT - TILE_SIZE * 3;
    const firstPlatform = this.addPlatform(GAME_WIDTH / 2, firstY, 5);

    this.generatedHeight = GAME_HEIGHT - firstPlatform.y;
    this.lastPlatformX = firstPlatform.x;
    this.lastPlatformY = firstPlatform.y;
    this.lastPlatformWidth = firstPlatform.width;
    this.pathPlatforms.push(firstPlatform);
  }

  generateNextSection(): void {
    const candidate = this.findNextPathPlatform();
    const placedPath = candidate
      ? this.addPlatform(candidate.x, candidate.y, candidate.width)
      : this.forcePlacePathPlatform();

    this.pathPlatforms.push(placedPath);
    if (this.pathPlatforms.length > MAX_PATH_HISTORY) {
      this.pathPlatforms.shift();
    }

    this.lastPlatformX = placedPath.x;
    this.lastPlatformY = placedPath.y;
    this.lastPlatformWidth = placedPath.width;
    this.generatedHeight = Math.max(this.generatedHeight, GAME_HEIGHT - placedPath.y);

    if (Math.random() < this.difficultySettings.heartSpawnChance) {
      this.createHeartPickup(placedPath.x, placedPath.y - TILE_SIZE * 1.5);
    }

    this.addDecorPlatforms(placedPath);
    this.trySpawnLadder(placedPath);
    this.trySpawnCoin(placedPath);
    this.trySpawnPortal(placedPath);

    if (Math.random() < PATTERN_CHANCE) {
      this.tryPlacePattern();
    }
  }

  private findNextPathPlatform(): PlacedPlatform | null {
    const last = this.getLastPathPlatform();

    for (let attempt = 0; attempt < MAX_PATH_ATTEMPTS; attempt++) {
      const step = this.pickPathStep();
      const nextY = last.y - step;
      const width = this.getPlatformWidth();
      const horizontalOffset = this.pickHorizontalOffset();
      const nextX = this.clampPlatformX(last.x + horizontalOffset, width);
      const candidate = this.buildPlatformData(nextX, nextY, width);

      if (!this.isValidPathCandidate(candidate, last)) {
        continue;
      }

      return candidate;
    }

    return null;
  }

  private forcePlacePathPlatform(): PlacedPlatform {
    const last = this.getLastPathPlatform();
    const width = Math.max(3, this.getPlatformWidth());
    const step = Math.min(MAX_PATH_STEP, PLAYER.MAX_JUMP_HEIGHT - TILE_SIZE * 0.25);
    const offsets = [0, TILE_SIZE * 2, -TILE_SIZE * 2, TILE_SIZE * 4, -TILE_SIZE * 4];

    for (const offset of offsets) {
      const candidate = this.buildPlatformData(
        this.clampPlatformX(last.x + offset, width),
        last.y - step,
        width
      );

      if (this.isValidPathCandidate(candidate, last)) {
        return this.addPlatform(candidate.x, candidate.y, candidate.width);
      }
    }

    const fallback = this.buildPlatformData(
      this.clampPlatformX(last.x, width),
      last.y - step,
      width
    );
    return this.addPlatform(fallback.x, fallback.y, fallback.width);
  }

  private addDecorPlatforms(anchor: PlacedPlatform): void {
    // Check region density before adding decor platforms
    if (this.isRegionTooCluttered(anchor.y)) {
      return;
    }

    const challenge = this.getDifficultyFactor();
    const maxExtras = Math.max(0, Math.round(lerp(1, 0, challenge)));
    const extraCount = randomInt(0, maxExtras);

    for (let i = 0; i < extraCount; i++) {
      // Recheck density after each platform
      if (this.isRegionTooCluttered(anchor.y)) {
        break;
      }
      this.tryPlaceDecorPlatform(anchor);
    }
  }

  private isRegionTooCluttered(centerY: number): boolean {
    const regionTop = centerY - REGION_CHECK_HEIGHT;
    const regionBottom = centerY + REGION_CHECK_HEIGHT / 2;

    const platformsInRegion = this.recentPlatforms.filter(
      (p) => p.y >= regionTop && p.y <= regionBottom
    );

    return platformsInRegion.length >= MAX_PLATFORMS_IN_REGION;
  }

  private tryPlaceDecorPlatform(anchor: PlacedPlatform): void {
    for (let attempt = 0; attempt < MAX_DECOR_ATTEMPTS; attempt++) {
      const width = randomInt(2, Math.max(2, this.getPlatformWidth() - 1));
      // Increased vertical spacing: 3-5 tiles instead of 1-3
      const verticalSteps = randomInt(3, 5);
      const y = anchor.y - verticalSteps * TILE_SIZE;

      // Increased horizontal spacing: 4-8 tiles instead of 2-6
      const horizontalSteps = randomInt(4, 8);
      const direction = Math.random() > 0.5 ? 1 : -1;
      const x = this.clampPlatformX(
        anchor.x + horizontalSteps * TILE_SIZE * direction,
        width
      );

      const candidate = this.buildPlatformData(x, y, width);

      if (this.overlapsExisting(candidate) || this.blocksPath(candidate)) {
        continue;
      }

      // Additional check: ensure minimum distance from all nearby platforms
      if (this.isTooCloseToExisting(candidate)) {
        continue;
      }

      this.addPlatform(candidate.x, candidate.y, candidate.width);
      return;
    }
  }

  private isTooCloseToExisting(candidate: PlacedPlatform): boolean {
    for (const platform of this.recentPlatforms) {
      const verticalDist = Math.abs(candidate.y - platform.y);
      const horizontalDist = Math.min(
        Math.abs(candidate.left - platform.right),
        Math.abs(candidate.right - platform.left)
      );

      // Check if platforms are on similar height but not overlapping
      if (verticalDist < MIN_DECOR_VERTICAL_GAP) {
        // If vertically close, require more horizontal distance
        if (horizontalDist < MIN_DECOR_HORIZONTAL_GAP) {
          return true;
        }
      }
    }
    return false;
  }

  private getDifficultyFactor(): number {
    const weights = this.difficultySettings.patternWeights;
    const total = weights.easy + weights.medium + weights.hard + weights.special;
    if (total <= 0) {
      return 0.5;
    }

    const challenge = (weights.medium * 0.5 + weights.hard) / total;
    return clamp(challenge, 0, 1);
  }

  private pickPathStep(): number {
    const challenge = this.getDifficultyFactor();
    const minStep = lerp(MIN_PATH_STEP, MIN_PATH_STEP + TILE_SIZE * 0.5, challenge);
    const maxStep = lerp(MAX_PATH_STEP - TILE_SIZE * 0.5, MAX_PATH_STEP, challenge);
    const minStepInt = Math.round(Math.min(minStep, maxStep));
    const maxStepInt = Math.round(Math.max(minStep, maxStep));

    return randomInt(minStepInt, Math.max(minStepInt, maxStepInt));
  }

  private pickHorizontalOffset(): number {
    const challenge = this.getDifficultyFactor();
    const keepDirChance = lerp(0.75, 0.55, challenge);
    if (Math.random() > keepDirChance) {
      this.pathDirection *= -1;
    }

    const minTiles = Math.round(lerp(1, 2, challenge));
    const maxTiles = Math.round(lerp(3, 5, challenge));
    const allowVertical = Math.random() < lerp(0.25, 0.05, challenge);

    const offsetTiles = allowVertical ? 0 : randomInt(minTiles, maxTiles);
    return offsetTiles * TILE_SIZE * this.pathDirection;
  }

  private getLastPathPlatform(): PlacedPlatform {
    const last = this.pathPlatforms[this.pathPlatforms.length - 1];
    if (last) {
      return last;
    }

    return this.buildPlatformData(this.lastPlatformX, this.lastPlatformY, this.lastPlatformWidth);
  }

  private isValidPathCandidate(candidate: PlacedPlatform, from: PlacedPlatform): boolean {
    const dx = candidate.x - from.x;
    const dy = from.y - candidate.y;

    if (dy <= 0) {
      return false;
    }

    if (!canReachWithJump(dx, dy)) {
      return false;
    }

    if (this.createsCeilingTrap(from, candidate)) {
      return false;
    }

    if (this.overlapsExisting(candidate)) {
      return false;
    }

    if (this.blocksPath(candidate)) {
      return false;
    }

    const allPlatforms = [...this.recentPlatforms, candidate];
    return canReachPlatform(from, candidate, allPlatforms).reachable;
  }

  private createsCeilingTrap(from: PlacedPlatform, to: PlacedPlatform): boolean {
    const verticalGap = from.y - to.y;
    if (verticalGap >= MIN_VERTICAL_GAP) {
      return false;
    }

    const overlapPadding = HORIZONTAL_CLEARANCE;
    const horizontalOverlap = !(
      to.right < from.left + overlapPadding || to.left > from.right - overlapPadding
    );

    return horizontalOverlap;
  }

  private overlapsExisting(candidate: PlacedPlatform): boolean {
    return this.recentPlatforms.some(
      (platform) =>
        this.platformsOverlap(candidate, platform) ||
        this.createsVerticalTrap(platform, candidate) ||
        this.createsNarrowGap(platform, candidate)
    );
  }

  private createsVerticalTrap(a: PlacedPlatform, b: PlacedPlatform): boolean {
    if (a === b) {
      return false;
    }

    // Ensure we always treat `from` as the lower platform and `to` as the upper one
    const from = a.y > b.y ? a : b;
    const to = a.y > b.y ? b : a;

    return this.createsCeilingTrap(from, to);
  }

  private createsNarrowGap(a: PlacedPlatform, b: PlacedPlatform): boolean {
    const verticalGap = Math.abs(a.y - b.y);
    if (verticalGap >= MIN_VERTICAL_GAP) {
      return false;
    }

    const gapLeft = a.left - b.right;
    const gapRight = b.left - a.right;
    const horizontalGap = Math.max(gapLeft, gapRight);

    return horizontalGap > 0 && horizontalGap < HORIZONTAL_CLEARANCE;
  }

  private platformsOverlap(a: PlacedPlatform, b: PlacedPlatform): boolean {
    const aTop = a.y - TILE_SIZE / 2;
    const aBottom = a.y + TILE_SIZE / 2;
    const bTop = b.y - TILE_SIZE / 2;
    const bBottom = b.y + TILE_SIZE / 2;

    const horizontalOverlap = a.right > b.left && a.left < b.right;
    const verticalOverlap = aBottom > bTop && aTop < bBottom;

    return horizontalOverlap && verticalOverlap;
  }

  private blocksPath(candidate: PlacedPlatform): boolean {
    if (this.pathPlatforms.length < 2) {
      return false;
    }

    const jumpOffsets = [-TILE_SIZE, 0, TILE_SIZE];

    for (let i = 0; i < this.pathPlatforms.length - 1; i++) {
      const from = this.pathPlatforms[i];
      const to = this.pathPlatforms[i + 1];
      let hasClearArc = false;

      for (const fromOffset of jumpOffsets) {
        for (const toOffset of jumpOffsets) {
          const fromX = clamp(from.x + fromOffset, from.left, from.right);
          const toX = clamp(to.x + toOffset, to.left, to.right);
          const fromY = from.y - TILE_SIZE / 2;
          const toY = to.y - TILE_SIZE / 2;
          const arc = calculateJumpArc(fromX, fromY, toX, toY);

          if (!arc) {
            continue;
          }

          const blocker = jumpArcBlockedBy(arc, [candidate]);
          if (!blocker) {
            hasClearArc = true;
            break;
          }
        }

        if (hasClearArc) {
          break;
        }
      }

      if (!hasClearArc) {
        return true;
      }
    }

    return false;
  }

  private getPlatformWidth(): number {
    const weights = this.difficultySettings.patternWeights;
    const hardRatio = weights.hard / (weights.easy + weights.medium + weights.hard + 0.001);

    if (hardRatio > 0.4) {
      return randomInt(2, 3);
    } else if (hardRatio > 0.2) {
      return randomInt(3, 4);
    }

    return randomInt(4, 6);
  }

  private clampPlatformX(x: number, width: number): number {
    const halfWidth = (width * TILE_SIZE) / 2;
    return clamp(x, halfWidth + EDGE_BUFFER, GAME_WIDTH - halfWidth - EDGE_BUFFER);
  }

  private buildPlatformData(x: number, y: number, width: number): PlacedPlatform {
    const widthPx = width * TILE_SIZE;

    return {
      x,
      y,
      width,
      left: x - widthPx / 2,
      right: x + widthPx / 2,
    };
  }

  private addPlatform(x: number, y: number, width: number): PlacedPlatform {
    const widthPx = width * TILE_SIZE;
    const platform = this.platforms.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
    platform.setDisplaySize(widthPx, TILE_SIZE);
    platform.refreshBody();

    const data = {
      x,
      y,
      width,
      left: x - widthPx / 2,
      right: x + widthPx / 2,
    };

    this.recentPlatforms.push(data);

    if (this.recentPlatforms.length > MAX_PLATFORM_HISTORY) {
      this.recentPlatforms.shift();
    }

    return data;
  }

  private selectPattern(): LevelPattern | null {
    const weights = this.difficultySettings.patternWeights;
    const categories = ['easy', 'medium', 'hard', 'special'] as const;
    const categoryWeights = categories.map((c) => weights[c]);
    const selectedCategory = weightedRandom([...categories], categoryWeights);

    const patternsInCategory = allPatterns.filter((p) => p.difficulty === selectedCategory);
    if (patternsInCategory.length === 0) {
      return null;
    }

    return patternsInCategory[randomInt(0, patternsInCategory.length - 1)];
  }

  private tryPlacePattern(): void {
    // Skip pattern if region is already cluttered
    if (this.isRegionTooCluttered(this.lastPlatformY)) {
      return;
    }

    const pattern = this.selectPattern();
    if (!pattern) {
      return;
    }

    const baseY = this.lastPlatformY - TILE_SIZE;
    const previewPlatforms: PlacedPlatform[] = [];
    const extraElements: PatternElement[] = [];

    for (const element of pattern.elements) {
      const worldX = (element.x / 10) * GAME_WIDTH;
      const worldY = baseY - element.y * FLOOR_HEIGHT;

      switch (element.type) {
        case 'platform': {
          const width = element.width || 3;
          const candidate = this.buildPlatformData(worldX, worldY, width);

          if (this.overlapsExisting(candidate) || this.blocksPath(candidate)) {
            return;
          }

          if (previewPlatforms.some((platform) => this.platformsOverlap(candidate, platform))) {
            return;
          }

          previewPlatforms.push(candidate);
          break;
        }
        default:
          extraElements.push({ ...element, x: worldX, y: worldY });
          break;
      }
    }

    for (const platform of previewPlatforms) {
      this.addPlatform(platform.x, platform.y, platform.width);
    }

    for (const element of extraElements) {
      switch (element.type) {
        case 'ladder':
          this.createLadder(element.x, element.y, element.height || 3);
          break;
        case 'portal_in':
          this.createPortal(element.x, element.y);
          break;
        case 'heart':
          this.createHeartPickup(element.x, element.y);
          break;
        case 'coin':
          this.createCoin(element.x, element.y);
          break;
        default:
          break;
      }
    }
  }

  private createLadder(x: number, y: number, height: number): void {
    const ladderHeightPx = TILE_SIZE * height;
    const topY = y - ladderHeightPx;
    const adjustedX = this.findClearLadderX(x, topY, y);
    if (adjustedX === null) {
      return;
    }
    const centerY = y - ladderHeightPx / 2;

    const ladder = this.ladders.create(adjustedX, centerY, 'ladder') as Phaser.Physics.Arcade.Sprite;
    ladder.setDisplaySize(TILE_SIZE, ladderHeightPx);
    ladder.refreshBody();

    const body = ladder.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE_SIZE - 8, ladderHeightPx);
    body.setOffset(4, 0);
  }

  private createPortal(x: number, y: number): void {
    const targetY = y - FLOOR_HEIGHT * 3;
    const portal = this.portals.create(x, y, 'portal') as Phaser.Physics.Arcade.Sprite;
    portal.setData('targetX', x);
    portal.setData('targetY', targetY);

    const body = portal.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.scene.tweens.add({
      targets: portal,
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 1.1, to: 0.9 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHeartPickup(x: number, y: number): void {
    const heart = this.heartPickups.create(x, y, 'heart_pickup') as Phaser.Physics.Arcade.Sprite;

    const body = heart.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.scene.tweens.add({
      targets: heart,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createCoin(x: number, y: number): void {
    const coin = this.coins.create(x, y, 'coin') as Phaser.Physics.Arcade.Sprite;
    const body = coin.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.scene.tweens.add({
      targets: coin,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private trySpawnLadder(anchor: PlacedPlatform): void {
    const challenge = this.getDifficultyFactor();
    const ladderChance = lerp(BASE_LADDER_CHANCE, MIN_LADDER_CHANCE, challenge);
    if (Math.random() > ladderChance) {
      return;
    }

    const height = randomInt(2, 4);
    const bottomY = anchor.y - TILE_SIZE / 2;
    const ladderHeightPx = height * TILE_SIZE;
    const topY = bottomY - ladderHeightPx;

    const baseLeft = anchor.left - TILE_SIZE / 2;
    const baseRight = anchor.right + TILE_SIZE / 2;
    const offsets = [0, TILE_SIZE, TILE_SIZE * 2];

    for (const offset of offsets) {
      const candidates = [baseRight + offset, baseLeft - offset];
      for (const candidate of candidates) {
        const x = this.clampPlatformX(candidate, 1);
        if (this.isLadderClear(x, topY, bottomY)) {
          this.createLadder(x, bottomY, height);
          return;
        }
      }
    }
  }

  private trySpawnCoin(anchor: PlacedPlatform): void {
    if (Math.random() > COIN_CHANCE) {
      return;
    }

    const y = anchor.y - TILE_SIZE * 1.2;
    const offsets = [0, TILE_SIZE, -TILE_SIZE, TILE_SIZE * 2, -TILE_SIZE * 2];

    for (const offset of offsets) {
      const x = this.clampPlatformX(anchor.x + offset, 1);
      if (this.isCoinClear(x, y)) {
        this.createCoin(x, y);
        return;
      }
    }
  }

  private trySpawnPortal(anchor: PlacedPlatform): void {
    if (Math.random() > PORTAL_CHANCE) {
      return;
    }

    const y = anchor.y - TILE_SIZE * 0.6;
    const offsets = [0, TILE_SIZE * 2, -TILE_SIZE * 2, TILE_SIZE * 3, -TILE_SIZE * 3];

    for (const offset of offsets) {
      const x = this.clampPlatformX(anchor.x + offset, 1);
      if (this.isPortalClear(x, y)) {
        this.createPortal(x, y);
        return;
      }
    }
  }

  private isLadderClear(x: number, topY: number, bottomY: number): boolean {
    return !this.recentPlatforms.some((platform) => {
      const platformTop = platform.y - TILE_SIZE / 2;
      const platformBottom = platform.y + TILE_SIZE / 2;
      const overlapsVertical = bottomY > platformTop && topY < platformBottom;
      const overlapsHorizontal = x > platform.left - 4 && x < platform.right + 4;
      return overlapsVertical && overlapsHorizontal;
    });
  }

  private findClearLadderX(x: number, topY: number, bottomY: number): number | null {
    const offsets = [0, TILE_SIZE, -TILE_SIZE, TILE_SIZE * 2, -TILE_SIZE * 2, TILE_SIZE * 3, -TILE_SIZE * 3];
    for (const offset of offsets) {
      const candidateX = this.clampPlatformX(x + offset, 1);
      if (this.isLadderClear(candidateX, topY, bottomY)) {
        return candidateX;
      }
    }
    return null;
  }

  private isCoinClear(x: number, y: number): boolean {
    return !this.recentPlatforms.some((platform) => {
      const platformTop = platform.y - TILE_SIZE / 2;
      const platformBottom = platform.y + TILE_SIZE / 2;
      const overlapsVertical = y > platformTop && y < platformBottom;
      const overlapsHorizontal = x > platform.left && x < platform.right;
      return overlapsVertical && overlapsHorizontal;
    });
  }

  private isPortalClear(x: number, y: number): boolean {
    if (!this.isCoinClear(x, y)) {
      return false;
    }

    const minPortalDistance = TILE_SIZE * 6;
    const portals = this.portals.getChildren() as Phaser.Physics.Arcade.Sprite[];
    return !portals.some((portal) => {
      const dx = portal.x - x;
      const dy = portal.y - y;
      return Math.hypot(dx, dy) < minPortalDistance;
    });
  }

  update(cameraY: number): void {
    const generateAheadDistance = GAME_HEIGHT * 2;
    const targetHeight = -cameraY + generateAheadDistance;

    while (this.generatedHeight < targetHeight) {
      this.generateNextSection();
    }

    this.cleanup(cameraY);
  }

  private cleanup(cameraY: number): void {
    const cleanupThreshold = cameraY + GAME_HEIGHT * 2;

    this.recentPlatforms = this.recentPlatforms.filter((p) => p.y <= cleanupThreshold);
    this.pathPlatforms = this.pathPlatforms.filter((p) => p.y <= cleanupThreshold);

    const destroyIfBelow = (sprite: Phaser.Physics.Arcade.Sprite) => {
      if (sprite.y > cleanupThreshold) {
        sprite.destroy();
      }
    };

    this.platforms.getChildren().forEach((p) => destroyIfBelow(p as Phaser.Physics.Arcade.Sprite));
    this.ladders.getChildren().forEach((l) => destroyIfBelow(l as Phaser.Physics.Arcade.Sprite));
    this.portals.getChildren().forEach((p) => destroyIfBelow(p as Phaser.Physics.Arcade.Sprite));
    this.heartPickups.getChildren().forEach((h) => destroyIfBelow(h as Phaser.Physics.Arcade.Sprite));
    this.coins.getChildren().forEach((c) => destroyIfBelow(c as Phaser.Physics.Arcade.Sprite));
  }
}
