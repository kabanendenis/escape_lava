import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class HUD extends Phaser.GameObjects.Container {
  private hearts: Phaser.GameObjects.Image[] = [];
  private timerText: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private coinText!: Phaser.GameObjects.Text;
  private maxHearts: number;
  private fullscreenButton!: Phaser.GameObjects.Container;
  private fullscreenLabel!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, maxHearts: number) {
    super(scene, 0, 0);

    this.maxHearts = maxHearts;

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(900);

    this.createHearts();
    this.timerText = this.createTimerText();
    this.floorText = this.createFloorText();
    this.createCoinUi();
    this.createFullscreenButton();
    this.registerFullscreenEvents();
  }

  private createHearts(): void {
    const startX = 15;
    const y = 20;
    const spacing = 28;

    for (let i = 0; i < this.maxHearts; i++) {
      const heart = this.scene.add.image(startX + i * spacing, y, 'heart');
      heart.setScale(1);
      this.hearts.push(heart);
      this.add(heart);
    }
  }

  private createTimerText(): Phaser.GameObjects.Text {
    const text = this.scene.add.text(GAME_WIDTH / 2, 15, '00:00', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0);
    this.add(text);
    return text;
  }

  private createFloorText(): Phaser.GameObjects.Text {
    const text = this.scene.add.text(GAME_WIDTH - 15, 15, 'Floor: 1 / 10', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(1, 0);
    this.add(text);
    return text;
  }

  private createCoinUi(): void {
    const x = GAME_WIDTH - 80;
    const y = 50;

    const icon = this.scene.add.image(x, y, 'coin');
    icon.setOrigin(0, 0.5);
    icon.setScale(1);
    this.add(icon);

    const text = this.scene.add.text(x + 24, y - 10, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffdd66',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0, 0);
    this.add(text);

    this.coinIcon = icon;
    this.coinText = text;
  }

  private createFullscreenButton(): void {
    const width = 90;
    const height = 34;
    const x = 15 + width / 2;
    const y = 64;

    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.45);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(2, 0x6666aa, 0.9);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const label = this.scene.add.text(0, 0, 'FULL', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive();

    container.on('pointerup', () => {
      if (!this.scene.sys.game.device.fullscreen.available) return;
      if (this.scene.scale.isFullscreen) {
        this.scene.scale.stopFullscreen();
      } else {
        this.scene.scale.startFullscreen();
      }
    });

    this.fullscreenButton = container;
    this.fullscreenLabel = label;
    this.add(container);

    if (!this.scene.sys.game.device.fullscreen.available) {
      container.setVisible(false);
    }

    if (this.scene.scale.isFullscreen) {
      this.fullscreenLabel.setText('EXIT');
    }
  }

  private registerFullscreenEvents(): void {
    this.scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => {
      this.fullscreenLabel.setText('EXIT');
    });
    this.scene.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, () => {
      this.fullscreenLabel.setText('FULL');
    });
  }

  update(
    currentHealth: number,
    maxHealth: number,
    time: string,
    currentFloor: number,
    targetFloor: number,
    coinCount: number
  ): void {
    this.updateHearts(currentHealth, maxHealth);
    this.timerText.setText(time);
    this.floorText.setText(`${currentFloor} / ${targetFloor}`);
    this.coinText.setText(`${coinCount}`);
  }

  private updateHearts(currentHealth: number, _maxHealth: number): void {
    for (let i = 0; i < this.hearts.length; i++) {
      const heart = this.hearts[i];

      if (i < Math.floor(currentHealth)) {
        heart.setTexture('heart');
        heart.setVisible(true);
      } else if (i < currentHealth) {
        heart.setTexture('heart_half');
        heart.setVisible(true);
      } else if (i < this.maxHearts) {
        heart.setTexture('heart_empty');
        heart.setVisible(true);
      } else {
        heart.setVisible(false);
      }
    }
  }
}
