import { LevelPattern } from '../../game/types';

// Special patterns - safe zones with hearts
// Still follow jumpable gap rules

export const restWithHeart: LevelPattern = {
  id: 'rest_with_heart',
  difficulty: 'special',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 0,
  maxExitX: 10,
  elements: [
    { type: 'platform', x: 5, y: 0.3, width: 8 },
    { type: 'heart', x: 5, y: 0.1 },
    { type: 'platform', x: 3, y: 0.9, width: 4 },
    { type: 'platform', x: 7, y: 0.9, width: 4 },
    { type: 'platform', x: 5, y: 1.5, width: 6 },
  ],
};

export const safeLadder: LevelPattern = {
  id: 'safe_ladder',
  difficulty: 'special',
  heightInFloors: 2,
  minEntryX: 0,
  maxEntryX: 10,
  minExitX: 3,
  maxExitX: 7,
  elements: [
    { type: 'platform', x: 5, y: 0.2, width: 6 },
    { type: 'ladder', x: 5, y: 0.9, height: 4 },
    { type: 'platform', x: 5, y: 1.5, width: 6 },
    { type: 'heart', x: 3, y: 1.3 },
  ],
};
