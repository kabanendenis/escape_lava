import { PLAYER, TILE_SIZE } from '../config';

/**
 * Jump arc physics calculator based on research from:
 * - "How to build a platformer AI" by Levi D
 * - "How to Make Insane, Procedural Platformer Levels" by Jordan Fisher
 *
 * Uses parabolic trajectory: y = y0 + v0*t + 0.5*g*t²
 */

export interface Point {
  x: number;
  y: number;
}

export interface Platform {
  x: number;      // center x
  y: number;      // center y (top of platform)
  width: number;  // in tiles
  left: number;   // left edge
  right: number;  // right edge
}

export interface JumpArc {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  peakY: number;
  points: Point[];
}

// Physics constants
const GRAVITY = PLAYER.GRAVITY;
const JUMP_VELOCITY = Math.abs(PLAYER.JUMP_VELOCITY);
const MOVE_SPEED = PLAYER.MOVE_SPEED;
const PLAYER_HEIGHT = PLAYER.HEIGHT;
const PLAYER_WIDTH = PLAYER.WIDTH;

// Maximum theoretical jump height: v²/(2g)
const MAX_JUMP_HEIGHT_THEORETICAL = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);

// Time to reach peak: t = v/g
const TIME_TO_PEAK = JUMP_VELOCITY / GRAVITY;

// Maximum horizontal distance in one jump (full arc)
const MAX_HORIZONTAL_DISTANCE = MOVE_SPEED * TIME_TO_PEAK * 2;

/**
 * Calculate jump arc between two platforms
 */
export function calculateJumpArc(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): JumpArc | null {
  const dx = toX - fromX;
  const dy = fromY - toY; // positive = jumping up (y increases downward in Phaser)

  // Check if reachable
  if (!canReachWithJump(dx, dy)) {
    return null;
  }

  // Calculate trajectory
  const horizontalDistance = Math.abs(dx);
  const direction = dx > 0 ? 1 : -1;

  // Time to cover horizontal distance
  const totalTime = horizontalDistance / MOVE_SPEED;

  // Calculate peak height needed
  // For going up: need enough height to clear the destination
  // For going down: just a normal arc

  const peakY = dy > 0
    ? fromY - (dy + TILE_SIZE) // need to go above destination
    : fromY - MAX_JUMP_HEIGHT_THEORETICAL * 0.6; // normal jump peak

  // Generate arc points for collision detection
  const points: Point[] = [];
  const numSamples = Math.max(20, Math.ceil(horizontalDistance / 10));

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const x = fromX + dx * t;

    // Parabolic interpolation
    // At t=0: y = fromY
    // At t=0.5: y = peakY
    // At t=1: y = toY
    const peakTime = 0.5;
    let y: number;

    if (t <= peakTime) {
      // Ascending
      const localT = t / peakTime;
      y = fromY + (peakY - fromY) * (1 - (1 - localT) * (1 - localT));
    } else {
      // Descending
      const localT = (t - peakTime) / (1 - peakTime);
      y = peakY + (toY - peakY) * localT * localT;
    }

    points.push({ x, y });
  }

  return {
    startX: fromX,
    startY: fromY,
    endX: toX,
    endY: toY,
    peakY,
    points
  };
}

/**
 * Check if destination is reachable with a single jump
 */
export function canReachWithJump(dx: number, dy: number): boolean {
  const horizontalDistance = Math.abs(dx);
  const verticalDistance = dy; // positive = jumping up

  // Can't jump higher than physics allows
  if (verticalDistance > MAX_JUMP_HEIGHT_THEORETICAL) {
    return false;
  }

  // Can't cover more horizontal distance than max
  if (horizontalDistance > MAX_HORIZONTAL_DISTANCE * 1.2) {
    return false;
  }

  // For upward jumps, check if we have enough height and time
  if (verticalDistance > 0) {
    // Time needed to reach height dy: solve dy = v*t - 0.5*g*t²
    // Using quadratic formula
    const discriminant = JUMP_VELOCITY * JUMP_VELOCITY - 2 * GRAVITY * verticalDistance;
    if (discriminant < 0) {
      return false;
    }

    // Time to reach that height (ascending)
    const timeToHeight = (JUMP_VELOCITY - Math.sqrt(discriminant)) / GRAVITY;

    // Horizontal distance we can cover in remaining jump time
    const remainingTime = TIME_TO_PEAK * 2 - timeToHeight;
    const maxHorizontalAtHeight = MOVE_SPEED * remainingTime;

    if (horizontalDistance > maxHorizontalAtHeight * 1.1) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a jump arc collides with any blocking platform
 */
export function jumpArcBlockedBy(
  arc: JumpArc,
  platforms: Platform[],
  ignorePlatform?: Platform
): Platform | null {
  // Check each point along the arc
  for (const point of arc.points) {
    for (const platform of platforms) {
      // Skip the platforms we're jumping from/to
      if (ignorePlatform &&
          platform.x === ignorePlatform.x &&
          platform.y === ignorePlatform.y) {
        continue;
      }

      // Check if point collides with platform
      // Platform collision box: consider player height
      const platformTop = platform.y - TILE_SIZE / 2;
      const platformBottom = platform.y + TILE_SIZE / 2;

      // Player's head position during jump
      const playerTop = point.y - PLAYER_HEIGHT;
      const playerBottom = point.y;

      // Check horizontal overlap
      const playerLeft = point.x - PLAYER_WIDTH / 2;
      const playerRight = point.x + PLAYER_WIDTH / 2;

      if (playerRight > platform.left && playerLeft < platform.right) {
        // Horizontal overlap exists, check vertical
        // Only block if platform is above the arc point (hitting head)
        if (platformBottom > playerTop && platformTop < playerBottom) {
          // Collision! But only if it's blocking our upward path
          // Allow passing through from below if going up and platform is the destination
          if (Math.abs(platform.y - arc.endY) > TILE_SIZE) {
            return platform;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Check if platform A can reach platform B without being blocked
 */
export function canReachPlatform(
  from: Platform,
  to: Platform,
  allPlatforms: Platform[]
): { reachable: boolean; blockedBy?: Platform } {
  // Calculate jump from edges of platforms for best chance
  const jumpOffsets = [-TILE_SIZE, 0, TILE_SIZE];

  for (const fromOffset of jumpOffsets) {
    for (const toOffset of jumpOffsets) {
      const fromX = Math.max(from.left, Math.min(from.right, from.x + fromOffset));
      const toX = Math.max(to.left, Math.min(to.right, to.x + toOffset));

      // Player stands on top of platform
      const fromY = from.y - TILE_SIZE / 2;
      const toY = to.y - TILE_SIZE / 2;

      const arc = calculateJumpArc(fromX, fromY, toX, toY);
      if (!arc) continue;

      // Check for blocking platforms
      const blocker = jumpArcBlockedBy(arc, allPlatforms, from);
      if (!blocker) {
        return { reachable: true };
      }
    }
  }

  // Try all offsets, couldn't find a clear path
  return {
    reachable: false,
    blockedBy: undefined
  };
}

/**
 * Find all platforms reachable from a given platform
 */
export function findReachablePlatforms(
  from: Platform,
  candidates: Platform[],
  allPlatforms: Platform[]
): Platform[] {
  return candidates.filter(to => {
    if (to === from) return false;
    return canReachPlatform(from, to, allPlatforms).reachable;
  });
}

/**
 * Validate that a level has a path from bottom to top
 * Uses breadth-first search on reachability graph
 */
export function validateLevelPath(
  platforms: Platform[],
  startY: number,
  endY: number
): { valid: boolean; unreachablePlatforms: Platform[] } {
  if (platforms.length === 0) {
    return { valid: false, unreachablePlatforms: [] };
  }

  // Sort platforms by Y (bottom to top in screen coords means higher Y first)
  const sorted = [...platforms].sort((a, b) => b.y - a.y);

  // Find starting platforms (closest to startY)
  const startPlatforms = sorted.filter(p => Math.abs(p.y - startY) < TILE_SIZE * 3);
  if (startPlatforms.length === 0) {
    return { valid: false, unreachablePlatforms: platforms };
  }

  // BFS to find all reachable platforms
  const reachable = new Set<Platform>(startPlatforms);
  const queue = [...startPlatforms];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find platforms we can jump to from current
    for (const candidate of sorted) {
      if (reachable.has(candidate)) continue;

      // Only consider platforms above current (smaller Y)
      if (candidate.y >= current.y) continue;

      // Check if reachable
      if (canReachPlatform(current, candidate, platforms).reachable) {
        reachable.add(candidate);
        queue.push(candidate);
      }
    }
  }

  // Find unreachable platforms
  const unreachablePlatforms = platforms.filter(p => !reachable.has(p));

  // Check if we can reach the end
  const endReached = sorted.some(p => reachable.has(p) && p.y <= endY + TILE_SIZE * 3);

  return {
    valid: endReached,
    unreachablePlatforms
  };
}

/**
 * Suggest a position for a new platform that doesn't block existing paths
 */
export function findNonBlockingPosition(
  newPlatform: { x: number; y: number; width: number },
  existingPlatforms: Platform[],
  fromPlatform: Platform
): { x: number; y: number } | null {
  const platformWidthPx = newPlatform.width * TILE_SIZE;
  const minGap = TILE_SIZE * 2;

  // Try different X positions
  const attempts = [
    newPlatform.x,
    newPlatform.x - TILE_SIZE * 2,
    newPlatform.x + TILE_SIZE * 2,
    newPlatform.x - TILE_SIZE * 4,
    newPlatform.x + TILE_SIZE * 4,
  ];

  for (const tryX of attempts) {
    // Create test platform
    const testPlatform: Platform = {
      x: tryX,
      y: newPlatform.y,
      width: newPlatform.width,
      left: tryX - platformWidthPx / 2,
      right: tryX + platformWidthPx / 2
    };

    // Check if any jump arc from below is blocked
    let blocks = false;
    for (const existing of existingPlatforms) {
      // Only check platforms below
      if (existing.y <= newPlatform.y) continue;

      // Check if this would block the path from existing to platforms above
      for (const target of existingPlatforms) {
        if (target.y >= newPlatform.y) continue;

        const arc = calculateJumpArc(
          existing.x,
          existing.y - TILE_SIZE / 2,
          target.x,
          target.y - TILE_SIZE / 2
        );

        if (arc) {
          const blocker = jumpArcBlockedBy(arc, [testPlatform], undefined);
          if (blocker) {
            blocks = true;
            break;
          }
        }
      }
      if (blocks) break;
    }

    if (!blocks) {
      return { x: tryX, y: newPlatform.y };
    }
  }

  return null;
}
