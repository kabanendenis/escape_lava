import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { DIFFICULTIES } from '../config/DifficultyConfig';
import { DifficultyLevel, GameData } from '../types';
import { getHighScore, formatTime } from '../utils';
import { fetchLeaderboard, LeaderboardEntry } from '../../telemetry/leaderboard';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
  private difficultyButtons: Phaser.GameObjects.Container[] = [];
  private selectedIndicator!: Phaser.GameObjects.Graphics;
  private leaderboardText?: Phaser.GameObjects.Text;
  private leaderboardTitle?: Phaser.GameObjects.Text;
  private leaderboardRequestId = 0;

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createLeaderboardPanel();
    this.createDifficultyButtons();
    this.createPlayButton();
    this.createInstructions();
  }

  private createBackground(): void {
    const bg = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT * 2, 'background');
    bg.setOrigin(0, 0);
    bg.setTint(0x333344);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.5
    );
    overlay.setOrigin(0.5);
  }

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 60, 'ESCAPE LAVA', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, 105, 'Побег от Лавы', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffaa66',
    });
    subtitle.setOrigin(0.5);
  }

  private createLeaderboardPanel(): void {
    const panelWidth = 260;
    const panelHeight = 260;
    const panelX = GAME_WIDTH - panelWidth / 2 - 20;
    const panelY = 170;

    const panel = this.add.rectangle(
      panelX,
      panelY + panelHeight / 2,
      panelWidth,
      panelHeight,
      0x000000,
      0.35,
    );
    panel.setOrigin(0.5);

    this.leaderboardTitle = this.add.text(panelX, panelY + 8, 'ТОП 10', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.leaderboardTitle.setOrigin(0.5, 0);

    this.leaderboardText = this.add.text(
      panelX - panelWidth / 2 + 16,
      panelY + 44,
      'Загрузка...',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        lineSpacing: 6,
      },
    );
  }

  private createDifficultyButtons(): void {
    const difficulties = Object.values(DifficultyLevel);
    const startY = 170;
    const buttonSpacing = 55;

    this.selectedIndicator = this.add.graphics();

    difficulties.forEach((level, index) => {
      const settings = DIFFICULTIES[level];
      const y = startY + index * buttonSpacing;

      const container = this.add.container(GAME_WIDTH / 2, y);

      const bg = this.add.image(0, 0, 'button');
      bg.setDisplaySize(280, 45);

      const nameText = this.add.text(-120, 0, settings.nameRu, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
      });
      nameText.setOrigin(0, 0.5);

      const highScore = getHighScore(level);
      const scoreText = this.add.text(
        100,
        0,
        highScore ? formatTime(highScore.time) : '--:--',
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#aaaaaa',
        }
      );
      scoreText.setOrigin(0.5);

      container.add([bg, nameText, scoreText]);
      container.setSize(280, 45);
      container.setInteractive();

      container.on('pointerover', () => {
        bg.setTexture('button_hover');
      });

      container.on('pointerout', () => {
        bg.setTexture('button');
      });

      container.on('pointerdown', () => {
        this.selectDifficulty(level, y);
      });

      this.difficultyButtons.push(container);

      if (level === this.selectedDifficulty) {
        this.selectDifficulty(level, y);
      }
    });
  }

  private selectDifficulty(level: DifficultyLevel, y: number): void {
    this.selectedDifficulty = level;

    this.selectedIndicator.clear();
    this.selectedIndicator.lineStyle(3, 0xff6600);
    this.selectedIndicator.strokeRoundedRect(
      GAME_WIDTH / 2 - 145,
      y - 25,
      290,
      50,
      10
    );

    void this.loadLeaderboard(level);
  }

  private async loadLeaderboard(difficulty: DifficultyLevel): Promise<void> {
    const requestId = ++this.leaderboardRequestId;
    const settings = DIFFICULTIES[difficulty];

    if (this.leaderboardTitle) {
      this.leaderboardTitle.setText(`ТОП 10 - ${settings.nameRu}`);
    }
    if (this.leaderboardText) {
      this.leaderboardText.setText('Загрузка...');
    }

    const entries = await fetchLeaderboard(difficulty, 10);
    if (requestId !== this.leaderboardRequestId) return;

    this.updateLeaderboardText(entries);
  }

  private updateLeaderboardText(entries: LeaderboardEntry[]): void {
    if (!this.leaderboardText) return;

    if (entries.length === 0) {
      this.leaderboardText.setText('Пока нет результатов');
      return;
    }

    const lines = entries.map(
      (entry, index) => `${index + 1}. ${entry.name} - ${formatTime(entry.timeMs)}`,
    );
    this.leaderboardText.setText(lines.join('\n'));
  }

  private createPlayButton(): void {
    const y = 460;

    const playButton = this.add.container(GAME_WIDTH / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xff6600, 1);
    bg.fillRoundedRect(-100, -30, 200, 60, 15);
    bg.lineStyle(3, 0xffaa00);
    bg.strokeRoundedRect(-100, -30, 200, 60, 15);

    const text = this.add.text(0, 0, 'ИГРАТЬ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);

    playButton.add([bg, text]);
    playButton.setSize(200, 60);
    playButton.setInteractive();

    playButton.on('pointerover', () => {
      playButton.setScale(1.05);
    });

    playButton.on('pointerout', () => {
      playButton.setScale(1);
    });

    playButton.on('pointerdown', () => {
      this.startGame();
    });
  }

  private createInstructions(): void {
    const instructions = this.add.text(
      GAME_WIDTH / 2,
      540,
      'Стрелки - движение | Пробел - прыжок',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#888888',
      }
    );
    instructions.setOrigin(0.5);

    const difficultyInfo = DIFFICULTIES[this.selectedDifficulty];
    const info = this.add.text(
      GAME_WIDTH / 2,
      565,
      `Высота: ${difficultyInfo.targetFloors} этажей`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#666666',
      }
    );
    info.setOrigin(0.5);
  }

  private startGame(): void {
    const gameData: GameData = {
      difficulty: this.selectedDifficulty,
    };
    this.scene.start(SCENES.GAME, gameData);
  }
}
