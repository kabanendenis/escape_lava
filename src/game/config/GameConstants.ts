export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TILE_SIZE = 32;
export const FLOOR_HEIGHT = 120;

export const GRID_COLUMNS = Math.floor(GAME_WIDTH / TILE_SIZE);

export const PLAYER = {
  MOVE_SPEED: 200,
  JUMP_VELOCITY: -450,
  AIR_JUMP_VELOCITY: -380,
  AIR_JUMP_HORIZONTAL_BOOST: 280,
  GRAVITY: 900,
  COYOTE_TIME_MS: 120,
  JUMP_BUFFER_MS: 120,
  MAX_FALL_SPEED: 600,
  INVINCIBILITY_MS: 1000,
  CLIMB_SPEED: 150,
  WIDTH: 32,
  HEIGHT: 48,
  // Max jump height = v²/(2g) = 450²/(2*900) = 112.5px
  // Safe max with margin for landing = 90px
  MAX_JUMP_HEIGHT: 90,
};

export const LAVA = {
  HEIGHT: 64,
  DAMAGE_INTERVAL_MS: 400,
  KNOCKBACK_VELOCITY: -200,
};

export const CAMERA = {
  LERP_X: 0.1,
  LERP_Y: 0.1,
  DEADZONE_WIDTH: 200,
  DEADZONE_HEIGHT: 100,
  LOOK_AHEAD_Y: -100,
};

export const COLORS = {
  BACKGROUND: 0x1a1a2e,
  PLATFORM: 0x8b7355,
  LADDER: 0x654321,
  PORTAL: 0x4444ff,
  COIN: 0xffcc33,
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
};

export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  RESULT: 'ResultScene',
};
