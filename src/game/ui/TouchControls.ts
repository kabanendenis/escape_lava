import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface TouchInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  up: boolean;
  down: boolean;
}

export class TouchControls extends Phaser.GameObjects.Container {
  private leftBtn!: Phaser.GameObjects.Container;
  private rightBtn!: Phaser.GameObjects.Container;
  private jumpBtn!: Phaser.GameObjects.Container;

  private touchInput: TouchInput = {
    left: false,
    right: false,
    jump: false,
    up: false,
    down: false,
  };

  private isTouchDevice: boolean;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.isTouchDevice = this.detectTouchDevice();

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(950);

    if (this.isTouchDevice) {
      this.createControls();
    }
  }

  private detectTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  private createControls(): void {
    const btnSize = 70;
    const padding = 20;
    const bottomY = GAME_HEIGHT - padding - btnSize / 2;

    this.leftBtn = this.createButton(
      padding + btnSize / 2,
      bottomY,
      btnSize,
      '<',
      () => (this.touchInput.left = true),
      () => (this.touchInput.left = false)
    );

    this.rightBtn = this.createButton(
      padding + btnSize * 1.7,
      bottomY,
      btnSize,
      '>',
      () => (this.touchInput.right = true),
      () => (this.touchInput.right = false)
    );

    this.jumpBtn = this.createButton(
      GAME_WIDTH - padding - btnSize / 2,
      bottomY,
      btnSize * 1.2,
      'JUMP',
      () => {
        this.touchInput.jump = true;
        this.touchInput.up = true;
      },
      () => {
        this.touchInput.jump = false;
        this.touchInput.up = false;
      }
    );

    this.add([this.leftBtn, this.rightBtn, this.jumpBtn]);
  }

  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    onDown: () => void,
    onUp: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333366, 0.7);
    bg.fillCircle(0, 0, size / 2);
    bg.lineStyle(3, 0x6666aa, 0.8);
    bg.strokeCircle(0, 0, size / 2);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: label.length > 1 ? '16px' : '28px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(size, size);
    container.setInteractive();

    container.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(0x5555aa, 0.9);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x8888cc, 1);
      bg.strokeCircle(0, 0, size / 2);
      onDown();
    });

    container.on('pointerup', () => {
      bg.clear();
      bg.fillStyle(0x333366, 0.7);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x6666aa, 0.8);
      bg.strokeCircle(0, 0, size / 2);
      onUp();
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333366, 0.7);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x6666aa, 0.8);
      bg.strokeCircle(0, 0, size / 2);
      onUp();
    });

    return container;
  }

  getInput(): TouchInput {
    return { ...this.touchInput };
  }

  show(): void {
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }

  isEnabled(): boolean {
    return this.isTouchDevice;
  }
}
