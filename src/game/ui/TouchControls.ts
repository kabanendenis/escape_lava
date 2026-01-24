import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface TouchInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  up: boolean;
  down: boolean;
}

type TouchButton = {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  size: number;
  setDown: () => void;
  setUp: () => void;
  pointerId: number | null;
};

export class TouchControls extends Phaser.GameObjects.Container {
  private leftBtn!: Phaser.GameObjects.Container;
  private rightBtn!: Phaser.GameObjects.Container;
  private jumpBtn!: Phaser.GameObjects.Container;
  private leftButton!: TouchButton;
  private rightButton!: TouchButton;
  private jumpButton!: TouchButton;

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
      this.registerInputHandlers();
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
    const btnSize = 135;
    const padding = 36;
    const bottomY = GAME_HEIGHT - padding - btnSize / 2;

    this.leftButton = this.createButton(
      padding + btnSize / 2,
      bottomY,
      btnSize,
      '<',
      () => (this.touchInput.left = true),
      () => (this.touchInput.left = false)
    );

    this.rightButton = this.createButton(
      padding + btnSize * 1.7,
      bottomY,
      btnSize,
      '>',
      () => (this.touchInput.right = true),
      () => (this.touchInput.right = false)
    );

    this.jumpButton = this.createButton(
      GAME_WIDTH - padding - btnSize / 2,
      bottomY,
      btnSize * 1.4,
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

    this.leftBtn = this.leftButton.container;
    this.rightBtn = this.rightButton.container;
    this.jumpBtn = this.jumpButton.container;

    this.add([this.leftBtn, this.rightBtn, this.jumpBtn]);
  }

  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    onDown: () => void,
    onUp: () => void
  ): TouchButton {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333366, 0.7);
    bg.fillCircle(0, 0, size / 2);
    bg.lineStyle(3, 0x6666aa, 0.8);
    bg.strokeCircle(0, 0, size / 2);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: label.length > 1 ? '18px' : '32px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(size, size);
    container.setInteractive();

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const btn = this.getButtonByContainer(container);
      if (btn && btn.pointerId !== null && btn.pointerId !== pointer.id) {
        return;
      }
      if (btn) {
        btn.pointerId = pointer.id;
      }
      bg.clear();
      bg.fillStyle(0x5555aa, 0.9);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x8888cc, 1);
      bg.strokeCircle(0, 0, size / 2);
      onDown();
    });

    container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const btn = this.getButtonByContainer(container);
      if (btn && btn.pointerId !== null && btn.pointerId !== pointer.id) {
        return;
      }
      if (btn) {
        btn.pointerId = null;
      }
      bg.clear();
      bg.fillStyle(0x333366, 0.7);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x6666aa, 0.8);
      bg.strokeCircle(0, 0, size / 2);
      onUp();
    });

    container.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      const btn = this.getButtonByContainer(container);
      if (btn && btn.pointerId !== null && btn.pointerId !== pointer.id) {
        return;
      }
      if (btn) {
        btn.pointerId = null;
      }
      bg.clear();
      bg.fillStyle(0x333366, 0.7);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x6666aa, 0.8);
      bg.strokeCircle(0, 0, size / 2);
      onUp();
    });

    return { container, bg, size, setDown: onDown, setUp: onUp, pointerId: null };
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

  private registerInputHandlers(): void {
    this.scene.input.addPointer(2);

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.releasePointer(pointer.id);
    });

    this.scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.releasePointer(pointer.id);
    });

    this.scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      this.releasePointer(pointer.id);
    });

    this.scene.input.on('gameout', () => {
      this.resetAll();
    });

    this.scene.events.on('update', this.validatePointers, this);
    this.scene.events.once('shutdown', this.cleanup, this);
    this.scene.events.once('destroy', this.cleanup, this);

    window.addEventListener('blur', this.resetAll);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') {
      this.resetAll();
    }
  };

  private resetAll = (): void => {
    this.touchInput.left = false;
    this.touchInput.right = false;
    this.touchInput.jump = false;
    this.touchInput.up = false;
    this.touchInput.down = false;

    this.releasePointer(null);
    this.updateButtonVisual(this.leftButton, false);
    this.updateButtonVisual(this.rightButton, false);
    this.updateButtonVisual(this.jumpButton, false);
  };

  private releasePointer(pointerId: number | null): void {
    const buttons = [this.leftButton, this.rightButton, this.jumpButton];
    for (const btn of buttons) {
      if (!btn) continue;
      if (pointerId === null || btn.pointerId === pointerId) {
        btn.pointerId = null;
        btn.setUp();
        this.updateButtonVisual(btn, false);
      }
    }
  }

  private updateButtonVisual(btn: TouchButton, pressed: boolean): void {
    if (!btn) return;
    const { bg, size } = btn;
    bg.clear();
    if (pressed) {
      bg.fillStyle(0x5555aa, 0.9);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x8888cc, 1);
      bg.strokeCircle(0, 0, size / 2);
    } else {
      bg.fillStyle(0x333366, 0.7);
      bg.fillCircle(0, 0, size / 2);
      bg.lineStyle(3, 0x6666aa, 0.8);
      bg.strokeCircle(0, 0, size / 2);
    }
  }

  private getButtonByContainer(container: Phaser.GameObjects.Container): TouchButton | null {
    if (this.leftButton?.container === container) return this.leftButton;
    if (this.rightButton?.container === container) return this.rightButton;
    if (this.jumpButton?.container === container) return this.jumpButton;
    return null;
  }

  private validatePointers(): void {
    const buttons = [this.leftButton, this.rightButton, this.jumpButton];
    for (const btn of buttons) {
      if (!btn || btn.pointerId === null) continue;
      const pointer = this.scene.input.pointers.find((p) => p.id === btn.pointerId);
      if (!pointer || !pointer.isDown) {
        this.releasePointer(btn.pointerId);
      }
    }
  }

  private cleanup(): void {
    this.scene.input.off('pointerup');
    this.scene.input.off('pointerupoutside');
    this.scene.input.off('pointercancel');
    this.scene.input.off('gameout');
    this.scene.events.off('update', this.validatePointers, this);
    window.removeEventListener('blur', this.resetAll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
