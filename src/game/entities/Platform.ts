import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

export class Platform extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 1,
    group?: Phaser.Physics.Arcade.StaticGroup
  ) {
    super(scene, x, y, 'platform');

    if (group) {
      group.add(this);
    } else {
      scene.add.existing(this);
      scene.physics.add.existing(this, true);
    }

    this.setDisplaySize(TILE_SIZE * width, TILE_SIZE);
    this.refreshBody();
  }
}

export function createPlatform(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  group: Phaser.Physics.Arcade.StaticGroup
): Phaser.Physics.Arcade.Sprite {
  const platform = group.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
  platform.setDisplaySize(TILE_SIZE * width, TILE_SIZE);
  platform.refreshBody();
  return platform;
}
