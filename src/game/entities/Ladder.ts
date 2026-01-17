import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

export class Ladder extends Phaser.Physics.Arcade.Sprite {
  private ladderHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    height: number = 3,
    group?: Phaser.Physics.Arcade.StaticGroup
  ) {
    super(scene, x, y, 'ladder');

    this.ladderHeight = height;

    if (group) {
      group.add(this);
    } else {
      scene.add.existing(this);
      scene.physics.add.existing(this, true);
    }

    this.setDisplaySize(TILE_SIZE, TILE_SIZE * height);
    this.refreshBody();

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE_SIZE - 8, TILE_SIZE * height);
    body.setOffset(4, 0);
  }

  getTop(): number {
    return this.y - (this.ladderHeight * TILE_SIZE) / 2;
  }

  getBottom(): number {
    return this.y + (this.ladderHeight * TILE_SIZE) / 2;
  }
}

export function createLadder(
  scene: Phaser.Scene,
  x: number,
  y: number,
  height: number,
  group: Phaser.Physics.Arcade.StaticGroup
): Phaser.Physics.Arcade.Sprite {
  const ladder = group.create(x, y, 'ladder') as Phaser.Physics.Arcade.Sprite;
  ladder.setDisplaySize(TILE_SIZE, TILE_SIZE * height);
  ladder.refreshBody();

  const body = ladder.body as Phaser.Physics.Arcade.StaticBody;
  body.setSize(TILE_SIZE - 8, TILE_SIZE * height);
  body.setOffset(4, 0);

  return ladder;
}
