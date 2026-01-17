import { DifficultyLevel, HighScoreEntry } from '../types';
import { getHighScore, saveHighScore, formatTime } from '../utils';

export class ScoreManager {
  private currentTime = 0;
  private isRunning = false;
  private difficulty: DifficultyLevel;

  constructor(difficulty: DifficultyLevel) {
    this.difficulty = difficulty;
  }

  start(): void {
    this.currentTime = 0;
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  update(delta: number): void {
    if (this.isRunning) {
      this.currentTime += delta;
    }
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getFormattedTime(): string {
    return formatTime(this.currentTime);
  }

  saveScore(): boolean {
    return saveHighScore(this.difficulty, this.currentTime);
  }

  getBestScore(): HighScoreEntry | null {
    return getHighScore(this.difficulty);
  }

  getFormattedBestScore(): string {
    const best = this.getBestScore();
    return best ? formatTime(best.time) : '--:--';
  }

  reset(): void {
    this.currentTime = 0;
    this.isRunning = false;
  }
}
