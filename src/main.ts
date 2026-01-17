import Phaser from 'phaser';
import { gameConfig } from './game/gameConfig';
import { incrementLaunchCount, setLaunchCountText } from './telemetry/launchCounter';

new Phaser.Game(gameConfig);

incrementLaunchCount()
  .then((count) => {
    setLaunchCountText(count);
  })
  .catch(() => {
    setLaunchCountText(null);
  });
