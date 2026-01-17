import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.createLoadingBar();
    this.loadAssets();
  }

  private createLoadingBar(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    const loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    const percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xff6600, 1);
      progressBar.fillRect(centerX - 150, centerY - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadAssets(): void {
    this.createPlaceholderGraphics();

    // Audio files are optional - game works without them
    // To add sounds, place .wav files in public/assets/audio/
    // this.load.audio('jump', 'assets/audio/jump.wav');
    // this.load.audio('hurt', 'assets/audio/hurt.wav');
    // this.load.audio('portal', 'assets/audio/portal.wav');
    // this.load.audio('pickup', 'assets/audio/pickup.wav');
    // this.load.audio('win', 'assets/audio/win.wav');
    // this.load.audio('lose', 'assets/audio/lose.wav');
  }

  private createPlaceholderGraphics(): void {
    const createPlayerFrame = (key: string, armSwing: number, legSwing: number): void => {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf2f2f2, 1);
      g.fillCircle(16, 10, 7);

      g.lineStyle(4, 0x1a1a1a, 1);
      g.lineBetween(16, 17, 16, 32);

      g.lineStyle(3, 0x1a1a1a, 1);
      g.lineBetween(16, 22, 8, 24 + armSwing);
      g.lineBetween(16, 22, 24, 24 - armSwing);

      g.lineStyle(3, 0x1a1a1a, 1);
      g.lineBetween(16, 32, 10, 46 + legSwing);
      g.lineBetween(16, 32, 22, 46 - legSwing);

      g.generateTexture(key, 32, 48);
      g.destroy();
    };

    createPlayerFrame('player_idle_1', 0, 0);
    createPlayerFrame('player_idle_2', 1, -1);
    createPlayerFrame('player_run_1', 3, -4);
    createPlayerFrame('player_run_2', -3, 4);
    createPlayerFrame('player_climb_1', 2, 2);
    createPlayerFrame('player_climb_2', -2, -2);
    createPlayerFrame('player_jump', 0, -2);

    const platformGraphics = this.make.graphics({ x: 0, y: 0 });
    platformGraphics.fillStyle(COLORS.PLATFORM, 1);
    platformGraphics.fillRect(0, 0, 32, 32);
    platformGraphics.lineStyle(2, 0x5c4033);
    platformGraphics.strokeRect(0, 0, 32, 32);
    platformGraphics.generateTexture('platform', 32, 32);
    platformGraphics.destroy();

    const ladderGraphics = this.make.graphics({ x: 0, y: 0 });
    ladderGraphics.fillStyle(COLORS.LADDER, 1);
    ladderGraphics.fillRect(0, 0, 4, 32);
    ladderGraphics.fillRect(28, 0, 4, 32);
    ladderGraphics.fillRect(0, 4, 32, 4);
    ladderGraphics.fillRect(0, 16, 32, 4);
    ladderGraphics.fillRect(0, 28, 32, 4);
    ladderGraphics.generateTexture('ladder', 32, 32);
    ladderGraphics.destroy();

    const portalGraphics = this.make.graphics({ x: 0, y: 0 });
    portalGraphics.fillStyle(COLORS.PORTAL, 0.8);
    portalGraphics.fillEllipse(24, 48, 40, 80);
    portalGraphics.fillStyle(0x8888ff, 0.6);
    portalGraphics.fillEllipse(24, 48, 30, 60);
    portalGraphics.fillStyle(0xaaaaff, 0.4);
    portalGraphics.fillEllipse(24, 48, 20, 40);
    portalGraphics.generateTexture('portal', 48, 96);
    portalGraphics.destroy();

    const heartGraphics = this.make.graphics({ x: 0, y: 0 });
    heartGraphics.fillStyle(0xff0000, 1);
    heartGraphics.fillCircle(8, 8, 6);
    heartGraphics.fillCircle(16, 8, 6);
    heartGraphics.fillTriangle(2, 10, 22, 10, 12, 22);
    heartGraphics.generateTexture('heart', 24, 24);
    heartGraphics.destroy();

    const heartEmptyGraphics = this.make.graphics({ x: 0, y: 0 });
    heartEmptyGraphics.lineStyle(2, 0x666666);
    heartEmptyGraphics.strokeCircle(8, 8, 6);
    heartEmptyGraphics.strokeCircle(16, 8, 6);
    heartEmptyGraphics.lineBetween(2, 10, 12, 22);
    heartEmptyGraphics.lineBetween(22, 10, 12, 22);
    heartEmptyGraphics.generateTexture('heart_empty', 24, 24);
    heartEmptyGraphics.destroy();

    const heartHalfGraphics = this.make.graphics({ x: 0, y: 0 });
    heartHalfGraphics.fillStyle(0x666666, 1);
    heartHalfGraphics.fillCircle(8, 8, 6);
    heartHalfGraphics.fillCircle(16, 8, 6);
    heartHalfGraphics.fillTriangle(2, 10, 22, 10, 12, 22);
    heartHalfGraphics.fillStyle(0xff0000, 1);
    heartHalfGraphics.fillCircle(8, 8, 6);
    heartHalfGraphics.fillTriangle(2, 10, 12, 10, 12, 22);
    heartHalfGraphics.generateTexture('heart_half', 24, 24);
    heartHalfGraphics.destroy();

    const heartPickupGraphics = this.make.graphics({ x: 0, y: 0 });
    heartPickupGraphics.fillStyle(0xff6699, 1);
    heartPickupGraphics.fillCircle(8, 8, 6);
    heartPickupGraphics.fillCircle(16, 8, 6);
    heartPickupGraphics.fillTriangle(2, 10, 22, 10, 12, 22);
    heartPickupGraphics.lineStyle(2, 0xffffff);
    heartPickupGraphics.strokeCircle(8, 8, 6);
    heartPickupGraphics.strokeCircle(16, 8, 6);
    heartPickupGraphics.generateTexture('heart_pickup', 24, 24);
    heartPickupGraphics.destroy();

    const coinGraphics = this.make.graphics({ x: 0, y: 0 });
    coinGraphics.fillStyle(COLORS.COIN, 1);
    coinGraphics.fillCircle(10, 10, 9);
    coinGraphics.fillStyle(0xffe27a, 1);
    coinGraphics.fillCircle(7, 7, 3);
    coinGraphics.lineStyle(2, 0xd49a00);
    coinGraphics.strokeCircle(10, 10, 9);
    coinGraphics.generateTexture('coin', 20, 20);
    coinGraphics.destroy();

    const lavaGraphics = this.make.graphics({ x: 0, y: 0 });
    lavaGraphics.fillStyle(0xff3300, 1);
    lavaGraphics.fillRect(0, 0, 64, 64);
    lavaGraphics.fillStyle(0xff6600, 0.7);
    lavaGraphics.fillCircle(16, 20, 10);
    lavaGraphics.fillCircle(48, 35, 8);
    lavaGraphics.fillStyle(0xffcc00, 0.5);
    lavaGraphics.fillCircle(32, 15, 6);
    lavaGraphics.generateTexture('lava', 64, 64);
    lavaGraphics.destroy();

    const backgroundGraphics = this.make.graphics({ x: 0, y: 0 });
    backgroundGraphics.fillStyle(0x4a3728, 1);
    backgroundGraphics.fillRect(0, 0, 64, 64);
    backgroundGraphics.lineStyle(1, 0x3a2718);
    for (let y = 0; y < 64; y += 16) {
      const offset = (y / 16) % 2 === 0 ? 0 : 32;
      for (let x = -32 + offset; x < 96; x += 64) {
        backgroundGraphics.strokeRect(x, y, 64, 16);
      }
    }
    backgroundGraphics.generateTexture('background', 64, 64);
    backgroundGraphics.destroy();

    const buttonGraphics = this.make.graphics({ x: 0, y: 0 });
    buttonGraphics.fillStyle(0x444466, 1);
    buttonGraphics.fillRoundedRect(0, 0, 200, 50, 10);
    buttonGraphics.lineStyle(2, 0x6666aa);
    buttonGraphics.strokeRoundedRect(0, 0, 200, 50, 10);
    buttonGraphics.generateTexture('button', 200, 50);
    buttonGraphics.destroy();

    const buttonHoverGraphics = this.make.graphics({ x: 0, y: 0 });
    buttonHoverGraphics.fillStyle(0x5555aa, 1);
    buttonHoverGraphics.fillRoundedRect(0, 0, 200, 50, 10);
    buttonHoverGraphics.lineStyle(2, 0x8888cc);
    buttonHoverGraphics.strokeRoundedRect(0, 0, 200, 50, 10);
    buttonHoverGraphics.generateTexture('button_hover', 200, 50);
    buttonHoverGraphics.destroy();

    const finishGraphics = this.make.graphics({ x: 0, y: 0 });
    finishGraphics.fillStyle(0x00ff00, 0.8);
    finishGraphics.fillRect(0, 0, 800, 32);
    finishGraphics.fillStyle(0xffffff, 0.5);
    for (let x = 0; x < 800; x += 40) {
      finishGraphics.fillRect(x, 0, 20, 16);
      finishGraphics.fillRect(x + 20, 16, 20, 16);
    }
    finishGraphics.generateTexture('finish_line', 800, 32);
    finishGraphics.destroy();
  }

  create(): void {
    this.createAnimations();
    this.scene.start(SCENES.MENU);
  }

  private createAnimations(): void {
    if (!this.anims.exists('player_idle')) {
      this.anims.create({
        key: 'player_idle',
        frames: [{ key: 'player_idle_1' }, { key: 'player_idle_2' }],
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!this.anims.exists('player_run')) {
      this.anims.create({
        key: 'player_run',
        frames: [{ key: 'player_run_1' }, { key: 'player_run_2' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('player_climb')) {
      this.anims.create({
        key: 'player_climb',
        frames: [{ key: 'player_climb_1' }, { key: 'player_climb_2' }],
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('player_jump')) {
      this.anims.create({
        key: 'player_jump',
        frames: [{ key: 'player_jump' }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }
}
