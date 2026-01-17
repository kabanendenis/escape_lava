import { LevelPattern } from '../../game/types';

// MAX_JUMP_HEIGHT = 90px, FLOOR_HEIGHT = 120px
// Max y step = 0.75 floors between platforms
// Hard patterns use smaller platforms but still jumpable gaps

export const tightJumps: LevelPattern = {
  id: 'tight_jumps',
  difficulty: 'hard',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 0,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 2 },
    { type: 'platform', x: 6, y: 0.7, width: 2 },
    { type: 'platform', x: 3, y: 1.1, width: 2 },
    { type: 'platform', x: 7, y: 1.5, width: 2 },
    { type: 'platform', x: 5, y: 1.9, width: 2 },
  ],
};

export const portalSkip: LevelPattern = {
  id: 'portal_skip',
  difficulty: 'hard',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 5,
  minExitX: 5,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 3 },
    { type: 'portal_in', x: 2, y: 0.1, portalId: 'portal_skip_1' },
    { type: 'platform', x: 5, y: 0.8, width: 2 },
    { type: 'platform', x: 8, y: 1.3, width: 3 },
    { type: 'platform', x: 5, y: 1.8, width: 3 },
  ],
};

export const mixedVertical: LevelPattern = {
  id: 'mixed_vertical',
  difficulty: 'hard',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 4,
  maxExitX: 6,
  elements: [
    { type: 'platform', x: 2, y: 0.3, width: 2 },
    { type: 'platform', x: 7, y: 0.3, width: 2 },
    { type: 'ladder', x: 5, y: 0.9, height: 3 },
    { type: 'platform', x: 5, y: 1.4, width: 3 },
    { type: 'platform', x: 3, y: 1.9, width: 2 },
    { type: 'platform', x: 7, y: 1.9, width: 2 },
  ],
};
