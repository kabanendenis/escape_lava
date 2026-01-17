import { LevelPattern } from '../../game/types';

// MAX_JUMP_HEIGHT = 90px, FLOOR_HEIGHT = 120px
// So max y step = 90/120 = 0.75 floors between platforms

export const stairsRight: LevelPattern = {
  id: 'stairs_right',
  difficulty: 'easy',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 4,
  minExitX: 6,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 1, y: 0.3, width: 4 },
    { type: 'platform', x: 3, y: 0.9, width: 3 },
    { type: 'platform', x: 5, y: 1.5, width: 3 },
    { type: 'platform', x: 8, y: 1.9, width: 4 },
  ],
};

export const stairsLeft: LevelPattern = {
  id: 'stairs_left',
  difficulty: 'easy',
  heightInFloors: 2,
  minEntryX: 6,
  maxEntryX: 10,
  minExitX: 0,
  maxExitX: 4,
  elements: [
    { type: 'platform', x: 8, y: 0.3, width: 4 },
    { type: 'platform', x: 6, y: 0.9, width: 3 },
    { type: 'platform', x: 4, y: 1.5, width: 3 },
    { type: 'platform', x: 2, y: 1.9, width: 4 },
  ],
};

export const flatRun: LevelPattern = {
  id: 'flat_run',
  difficulty: 'easy',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 0,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 4 },
    { type: 'platform', x: 7, y: 0.3, width: 4 },
    { type: 'platform', x: 5, y: 0.9, width: 5 },
    { type: 'platform', x: 3, y: 1.5, width: 4 },
    { type: 'platform', x: 7, y: 1.5, width: 4 },
  ],
};
