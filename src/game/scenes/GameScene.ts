import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FLOOR_HEIGHT, TILE_SIZE, PLAYER, LAVA, CAMERA } from '../config';
import { DIFFICULTIES } from '../config/DifficultyConfig';
import { DifficultyLevel, DifficultySettings, GameData, GameState } from '../types';
import { ScoreManager } from '../managers';
import { Player } from '../entities/Player';
import { Lava } from '../entities/Lava';
import { LevelGenerator } from '../systems/LevelGenerator';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private lava!: Lava;
  private levelGenerator!: LevelGenerator;
  private hud!: HUD;
  private touchControls!: TouchControls;
  private scoreManager!: ScoreManager;

  private difficulty!: DifficultyLevel;
  private difficultySettings!: DifficultySettings;
  private gameState: GameState = GameState.PLAYING;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladders!: Phaser.Physics.Arcade.StaticGroup;
  private portals!: Phaser.Physics.Arcade.Group;
  private heartPickups!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private finishLine!: Phaser.GameObjects.Image;

  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private coinCount = 0;

  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data: GameData): void {
    this.difficulty = data.difficulty || DifficultyLevel.NORMAL;
    this.difficultySettings = DIFFICULTIES[this.difficulty];
    this.gameState = GameState.PLAYING;
    this.isPaused = false;
    this.coinCount = 0;
  }

  create(): void {
    this.createBackground();
    this.createGroups();
    this.createLevelGenerator();
    this.createPlayer();
    this.createLava();
    this.createFinishLine();
    this.setupCamera();
    this.setupCollisions();
    this.createHUD();
    this.createTouchControls();
    this.createPauseOverlay();
    this.setupInput();

    this.scoreManager = new ScoreManager(this.difficulty);
    this.scoreManager.start();
  }

  private createBackground(): void {
    const totalHeight = this.difficultySettings.targetFloors * FLOOR_HEIGHT + GAME_HEIGHT;
    const bg = this.add.tileSprite(
      0,
      -totalHeight + GAME_HEIGHT,
      GAME_WIDTH,
      totalHeight,
      'background'
    );
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.5);
  }

  private createGroups(): void {
    this.platforms = this.physics.add.staticGroup();
    this.ladders = this.physics.add.staticGroup();
    this.portals = this.physics.add.group();
    this.heartPickups = this.physics.add.group();
    this.coins = this.physics.add.group();
  }

  private createLevelGenerator(): void {
    this.levelGenerator = new LevelGenerator(
      this,
      this.platforms,
      this.ladders,
      this.portals,
      this.heartPickups,
      this.coins,
      this.difficultySettings
    );
    this.levelGenerator.generateInitialLevel();
  }

  private createPlayer(): void {
    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT - 100;

    this.player = new Player(this, startX, startY, this.difficultySettings.hearts);
  }

  private createLava(): void {
    this.lava = new Lava(
      this,
      GAME_HEIGHT + LAVA.HEIGHT,
      this.difficultySettings.lavaSpeed,
      this.difficultySettings.lavaColor
    );
  }

  private createFinishLine(): void {
    const finishY = -(this.difficultySettings.targetFloors * FLOOR_HEIGHT - GAME_HEIGHT / 2);
    this.finishLine = this.add.image(GAME_WIDTH / 2, finishY, 'finish_line');
    this.finishLine.setOrigin(0.5, 1);
  }

  private setupCamera(): void {
    const totalHeight = this.difficultySettings.targetFloors * FLOOR_HEIGHT + GAME_HEIGHT;

    // Set physics world bounds to match the level size
    this.physics.world.setBounds(0, -totalHeight + GAME_HEIGHT, GAME_WIDTH, totalHeight);

    this.cameras.main.setBounds(0, -totalHeight + GAME_HEIGHT, GAME_WIDTH, totalHeight);
    this.cameras.main.startFollow(this.player, true, CAMERA.LERP_X, CAMERA.LERP_Y);
    this.cameras.main.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT);
    this.cameras.main.setFollowOffset(0, CAMERA.LOOK_AHEAD_Y);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.ladders,
      (_player, ladder) => {
        this.player.setNearLadder(ladder as Phaser.Physics.Arcade.Sprite);
      },
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.portals,
      this.handlePortalCollision.bind(this) as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.heartPickups,
      this.handleHeartPickup.bind(this) as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.coins,
      this.handleCoinPickup.bind(this) as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private handlePortalCollision(
    _player: Phaser.GameObjects.GameObject,
    portal: Phaser.GameObjects.GameObject
  ): void {
    const portalSprite = portal as Phaser.Physics.Arcade.Sprite;
    const targetY = portalSprite.getData('targetY') as number;
    const targetX = portalSprite.getData('targetX') as number;

    if (targetY !== undefined && !this.player.isInPortalCooldown()) {
      this.player.teleport(targetX || this.player.x, targetY);
      this.playSound('portal');
    }
  }

  private handleHeartPickup(
    _player: Phaser.GameObjects.GameObject,
    heart: Phaser.GameObjects.GameObject
  ): void {
    const heartSprite = heart as Phaser.Physics.Arcade.Sprite;
    this.player.heal(1);
    heartSprite.destroy();
    this.playSound('pickup');
  }

  private handleCoinPickup(
    _player: Phaser.GameObjects.GameObject,
    coin: Phaser.GameObjects.GameObject
  ): void {
    const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
    this.coinCount += 1;
    coinSprite.destroy();
    this.lava.applySlow(1000);
    this.playSound('pickup');
  }

  private createHUD(): void {
    this.hud = new HUD(this, this.difficultySettings.hearts);
  }

  private createTouchControls(): void {
    this.touchControls = new TouchControls(this);
  }

  private createPauseOverlay(): void {
    this.pauseOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(1000);
    this.pauseOverlay.setVisible(false);

    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    const pauseText = this.add.text(0, -60, 'ПАУЗА', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ffffff',
    });
    pauseText.setOrigin(0.5);

    const resumeBtn = this.createPauseButton(0, 20, 'Продолжить', () => this.togglePause());
    const restartBtn = this.createPauseButton(0, 80, 'Заново', () => this.restartGame());
    const menuBtn = this.createPauseButton(0, 140, 'Меню', () => this.goToMenu());

    this.pauseOverlay.add([bg, pauseText, resumeBtn, restartBtn, menuBtn]);
  }

  private createPauseButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    const bg = this.add.image(0, 0, 'button');
    bg.setDisplaySize(180, 45);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    btnText.setOrigin(0.5);

    btn.add([bg, btnText]);
    btn.setSize(180, 45);
    btn.setInteractive();

    btn.on('pointerover', () => bg.setTexture('button_hover'));
    btn.on('pointerout', () => bg.setTexture('button'));
    btn.on('pointerdown', callback);

    return btn;
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);

    if (this.isPaused) {
      this.physics.pause();
      this.scoreManager.stop();
    } else {
      this.physics.resume();
      this.scoreManager.start();
    }
  }

  private restartGame(): void {
    this.scene.restart({ difficulty: this.difficulty } as GameData);
  }

  private goToMenu(): void {
    this.scene.start(SCENES.MENU);
  }

  private playSound(key: string): void {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.gameState !== GameState.PLAYING) {
      return;
    }

    this.scoreManager.update(delta);

    const input = this.getInput();
    this.player.handleInput(input);
    this.player.update(delta);

    this.lava.update(delta);

    this.checkLavaCollision();
    this.checkWinCondition();
    this.checkLoseCondition();

    this.levelGenerator.update(this.cameras.main.scrollY);

    this.hud.update(
      this.player.getHealth(),
      this.player.getMaxHealth(),
      this.scoreManager.getFormattedTime(),
      this.getCurrentFloor(),
      this.difficultySettings.targetFloors,
      this.coinCount
    );

    this.player.clearNearLadder();
  }

  private getInput(): { left: boolean; right: boolean; jump: boolean; up: boolean; down: boolean } {
    const cursors = this.input.keyboard?.createCursorKeys();
    const touchInput = this.touchControls.getInput();

    return {
      left: cursors?.left.isDown || touchInput.left,
      right: cursors?.right.isDown || touchInput.right,
      jump: cursors?.space?.isDown || cursors?.up.isDown || touchInput.jump,
      up: cursors?.up.isDown || touchInput.up,
      down: cursors?.down.isDown || touchInput.down,
    };
  }

  private checkLavaCollision(): void {
    if (this.player.y > this.lava.getY() - LAVA.HEIGHT / 2) {
      if (this.player.canTakeDamage()) {
        this.player.takeDamage(this.difficultySettings.damagePerHit);
        this.player.knockback();
        this.playSound('hurt');
        this.cameras.main.shake(100, 0.01);
      }
    }
  }

  private checkWinCondition(): void {
    const finishY = -(this.difficultySettings.targetFloors * FLOOR_HEIGHT - GAME_HEIGHT / 2);
    if (this.player.y < finishY) {
      this.gameState = GameState.WIN;
      this.scoreManager.stop();
      const isNewRecord = this.scoreManager.saveScore();
      this.playSound('win');

      const gameData: GameData = {
        difficulty: this.difficulty,
        finalTime: this.scoreManager.getCurrentTime(),
        won: true,
      };

      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.RESULT, { ...gameData, isNewRecord });
      });
    }
  }

  private checkLoseCondition(): void {
    if (this.player.getHealth() <= 0) {
      this.gameState = GameState.LOSE;
      this.scoreManager.stop();
      this.playSound('lose');

      const gameData: GameData = {
        difficulty: this.difficulty,
        finalTime: this.scoreManager.getCurrentTime(),
        won: false,
      };

      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.RESULT, gameData);
      });
    }
  }

  private getCurrentFloor(): number {
    const playerY = this.player.y;
    const startY = GAME_HEIGHT - 100;
    const floor = Math.floor((startY - playerY) / FLOOR_HEIGHT) + 1;
    return Math.max(1, floor);
  }
}
