import { LevelPattern } from '../../game/types';

// MAX_JUMP_HEIGHT = 90px, FLOOR_HEIGHT = 120px
// Max y step = 0.75 floors between platforms

export const platformHops: LevelPattern = {
  id: 'platform_hops',
  difficulty: 'medium',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 0,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 3 },
    { type: 'platform', x: 6, y: 0.7, width: 2 },
    { type: 'platform', x: 3, y: 1.1, width: 2 },
    { type: 'platform', x: 7, y: 1.5, width: 3 },
    { type: 'platform', x: 4, y: 1.9, width: 3 },
  ],
};

export const zigzag: LevelPattern = {
  id: 'zigzag',
  difficulty: 'medium',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 5,
  minExitX: 5,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 3 },
    { type: 'platform', x: 7, y: 0.7, width: 3 },
    { type: 'platform', x: 2, y: 1.2, width: 3 },
    { type: 'platform', x: 7, y: 1.6, width: 3 },
  ],
};

export const ladderClimb: LevelPattern = {
  id: 'ladder_climb',
  difficulty: 'medium',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 3,
  maxExitX: 7,
  elements: [
    { type: 'platform', x: 3, y: 0.2, width: 4 },
    { type: 'ladder', x: 5, y: 0.8, height: 3 },
    { type: 'platform', x: 5, y: 1.4, width: 4 },
    { type: 'platform', x: 5, y: 1.9, width: 5 },
  ],
};
