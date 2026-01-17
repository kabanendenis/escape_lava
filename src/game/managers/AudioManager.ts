import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private isMuted = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload(): void {
    this.scene.load.audio('jump', 'assets/audio/jump.wav');
    this.scene.load.audio('hurt', 'assets/audio/hurt.wav');
    this.scene.load.audio('portal', 'assets/audio/portal.wav');
    this.scene.load.audio('pickup', 'assets/audio/pickup.wav');
    this.scene.load.audio('win', 'assets/audio/win.wav');
    this.scene.load.audio('lose', 'assets/audio/lose.wav');
  }

  init(): void {
    const soundKeys = ['jump', 'hurt', 'portal', 'pickup', 'win', 'lose'];
    soundKeys.forEach((key) => {
      if (this.scene.cache.audio.exists(key)) {
        this.sounds.set(key, this.scene.sound.add(key, { volume: this.sfxVolume }));
      }
    });
  }

  play(key: string): void {
    if (this.isMuted) return;

    const sound = this.sounds.get(key);
    if (sound) {
      sound.play();
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.scene.sound.mute = muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = volume;
    this.sounds.forEach((sound) => {
      if ('setVolume' in sound) {
        (sound as Phaser.Sound.WebAudioSound).setVolume(volume);
      }
    });
  }
}
