import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class HUD extends Phaser.GameObjects.Container {
  private hearts: Phaser.GameObjects.Image[] = [];
  private timerText: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private maxHearts: number;

  constructor(scene: Phaser.Scene, maxHearts: number) {
    super(scene, 0, 0);

    this.maxHearts = maxHearts;

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(900);

    this.createHearts();
    this.timerText = this.createTimerText();
    this.floorText = this.createFloorText();
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

  update(
    currentHealth: number,
    maxHealth: number,
    time: string,
    currentFloor: number,
    targetFloor: number
  ): void {
    this.updateHearts(currentHealth, maxHealth);
    this.timerText.setText(time);
    this.floorText.setText(`${currentFloor} / ${targetFloor}`);
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
