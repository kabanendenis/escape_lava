import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DIFFICULTIES } from '../config/DifficultyConfig';
import { DifficultyLevel, GameData } from '../types';
import { formatTime, getHighScore } from '../utils';

interface ResultData extends GameData {
  isNewRecord?: boolean;
}

export class ResultScene extends Phaser.Scene {
  private difficulty!: DifficultyLevel;
  private finalTime!: number;
  private won!: boolean;
  private isNewRecord!: boolean;

  constructor() {
    super({ key: SCENES.RESULT });
  }

  init(data: ResultData): void {
    this.difficulty = data.difficulty || DifficultyLevel.NORMAL;
    this.finalTime = data.finalTime || 0;
    this.won = data.won || false;
    this.isNewRecord = data.isNewRecord || false;
  }

  create(): void {
    this.createBackground();
    this.createContent();
    this.createButtons();
  }

  private createBackground(): void {
    const bg = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT * 2, 'background');
    bg.setOrigin(0, 0);
    bg.setTint(this.won ? 0x224422 : 0x442222);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.6
    );
    overlay.setOrigin(0.5);
  }

  private createContent(): void {
    const settings = DIFFICULTIES[this.difficulty];

    const titleText = this.won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
    const titleColor = this.won ? '#00ff00' : '#ff3300';

    const title = this.add.text(GAME_WIDTH / 2, 100, titleText, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '56px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    if (this.won) {
      this.createWinAnimation(title);
    }

    const difficultyText = this.add.text(
      GAME_WIDTH / 2,
      170,
      `Сложность: ${settings.nameRu}`,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#aaaaaa',
      }
    );
    difficultyText.setOrigin(0.5);

    const timeLabel = this.add.text(GAME_WIDTH / 2, 230, 'Время:', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#888888',
    });
    timeLabel.setOrigin(0.5);

    const timeText = this.add.text(GAME_WIDTH / 2, 270, formatTime(this.finalTime), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    timeText.setOrigin(0.5);

    if (this.isNewRecord) {
      const recordText = this.add.text(GAME_WIDTH / 2, 320, 'НОВЫЙ РЕКОРД!', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '28px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 3,
      });
      recordText.setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (this.won) {
      const bestScore = getHighScore(this.difficulty);
      if (bestScore) {
        const bestText = this.add.text(
          GAME_WIDTH / 2,
          320,
          `Лучшее время: ${formatTime(bestScore.time)}`,
          {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888',
          }
        );
        bestText.setOrigin(0.5);
      }
    }
  }

  private createWinAnimation(title: Phaser.GameObjects.Text): void {
    this.tweens.add({
      targets: title,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const delay = Phaser.Math.Between(0, 1000);

      this.time.delayedCall(delay, () => {
        const particle = this.add.circle(x, GAME_HEIGHT + 50, 8, 0xffcc00);
        this.tweens.add({
          targets: particle,
          y: -50,
          alpha: { from: 1, to: 0 },
          duration: 2000,
          ease: 'Sine.easeOut',
          onComplete: () => particle.destroy(),
        });
      });
    }
  }

  private createButtons(): void {
    const buttonY = 420;
    const buttonSpacing = 70;

    this.createButton(GAME_WIDTH / 2, buttonY, 'Заново', () => this.restartGame());
    this.createButton(GAME_WIDTH / 2, buttonY + buttonSpacing, 'Меню', () => this.goToMenu());
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const container = this.add.container(x, y);

    const bg = this.add.image(0, 0, 'button');
    bg.setDisplaySize(200, 50);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
    });
    btnText.setOrigin(0.5);

    container.add([bg, btnText]);
    container.setSize(200, 50);
    container.setInteractive();

    container.on('pointerover', () => {
      bg.setTexture('button_hover');
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.setTexture('button');
      container.setScale(1);
    });

    container.on('pointerdown', callback);
  }

  private restartGame(): void {
    this.scene.start(SCENES.GAME, { difficulty: this.difficulty } as GameData);
  }

  private goToMenu(): void {
    this.scene.start(SCENES.MENU);
  }
}
