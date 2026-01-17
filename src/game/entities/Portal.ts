import Phaser from 'phaser';

export class Portal extends Phaser.Physics.Arcade.Sprite {
  private targetX: number;
  private targetY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    group?: Phaser.Physics.Arcade.Group
  ) {
    super(scene, x, y, 'portal');

    this.targetX = targetX;
    this.targetY = targetY;

    if (group) {
      group.add(this);
    } else {
      scene.add.existing(this);
      scene.physics.add.existing(this);
    }

    this.setData('targetX', targetX);
    this.setData('targetY', targetY);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    scene.tweens.add({
      targets: this,
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 1.1, to: 0.9 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  getTargetX(): number {
    return this.targetX;
  }

  getTargetY(): number {
    return this.targetY;
  }
}

export function createPortalPair(
  scene: Phaser.Scene,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  group: Phaser.Physics.Arcade.Group
): [Portal, Portal] {
  const portal1 = new Portal(scene, x1, y1, x2, y2, group);
  const portal2 = new Portal(scene, x2, y2, x1, y1, group);

  portal1.setTint(0x4444ff);
  portal2.setTint(0xff44ff);

  return [portal1, portal2];
}
