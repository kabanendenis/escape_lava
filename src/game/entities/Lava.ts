import Phaser from 'phaser';
import { GAME_WIDTH, LAVA } from '../config';

export class Lava extends Phaser.GameObjects.Container {
  private surface: Phaser.GameObjects.TileSprite;
  private lavaBody: Phaser.GameObjects.Rectangle;
  private riseSpeed: number;
  private currentY: number;
  private lavaColor: number;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private startDelay: number;
  private isRising = false;

  constructor(
    scene: Phaser.Scene,
    startY: number,
    riseSpeed: number,
    color: number,
    startDelay: number = 5000
  ) {
    super(scene, 0, startY);

    this.currentY = startY;
    this.riseSpeed = riseSpeed;
    this.lavaColor = color;
    this.startDelay = startDelay;

    // Initially hide lava and start rising (and become visible) after delay
    this.setVisible(false);

    scene.time.delayedCall(startDelay, () => {
      this.isRising = true;
      this.setVisible(true);
    });

    scene.add.existing(this);

    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    this.surface = scene.add.tileSprite(GAME_WIDTH / 2, 0, GAME_WIDTH, LAVA.HEIGHT, 'lava');
    this.surface.setTint(color);
    this.add(this.surface);

    this.lavaBody = scene.add.rectangle(
      GAME_WIDTH / 2,
      LAVA.HEIGHT / 2 + 20,
      GAME_WIDTH,
      500,
      color,
      0.9
    );
    this.add(this.lavaBody);

    this.createGlow();
    this.createBubbles(scene);

    this.setDepth(100);
  }

  private createGlow(): void {
    this.glowGraphics.clear();

    const gradient = this.scene.add.graphics();

    for (let i = 0; i < 30; i++) {
      const alpha = 0.3 * (1 - i / 30);
      gradient.fillStyle(this.lavaColor, alpha);
      gradient.fillRect(0, -i * 2 - LAVA.HEIGHT / 2, GAME_WIDTH, 2);
    }

    this.add(gradient);
    gradient.setPosition(0, 0);
  }

  private createBubbles(scene: Phaser.Scene): void {
    const emitter = scene.add.particles(0, -LAVA.HEIGHT / 2, 'lava', {
      speed: { min: 20, max: 50 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.2, end: 0 },
      lifespan: 1000,
      frequency: 200,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, 10),
      } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      tint: this.lavaColor,
    });

    this.add(emitter);
  }

  update(delta: number): void {
    // Only rise after start delay
    if (this.isRising) {
      const moveAmount = (this.riseSpeed * delta) / 1000;
      this.currentY -= moveAmount;
      this.setY(this.currentY);
    }

    // Always animate the surface
    this.surface.tilePositionX += delta * 0.02;
    this.surface.tilePositionY += delta * 0.01;

    const wobble = Math.sin(this.scene.time.now / 300) * 2;
    this.surface.setY(wobble);
  }

  isStarted(): boolean {
    return this.isRising;
  }

  getStartDelay(): number {
    return this.startDelay;
  }

  getY(): number {
    return this.currentY;
  }

  setSpeed(speed: number): void {
    this.riseSpeed = speed;
  }

  getSpeed(): number {
    return this.riseSpeed;
  }
}
