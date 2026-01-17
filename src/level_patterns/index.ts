import { LevelPattern } from '../game/types';

import { stairsRight, stairsLeft, flatRun } from './easy/stairs_right';
import { platformHops, zigzag, ladderClimb } from './medium/platform_hops';
import { tightJumps, portalSkip, mixedVertical } from './hard/tight_jumps';
import { restWithHeart, safeLadder } from './special/rest_section';

export const easyPatterns: LevelPattern[] = [stairsRight, stairsLeft, flatRun];

export const mediumPatterns: LevelPattern[] = [platformHops, zigzag, ladderClimb];

export const hardPatterns: LevelPattern[] = [tightJumps, mixedVertical];

export const specialPatterns: LevelPattern[] = [restWithHeart, safeLadder, portalSkip];

export const allPatterns: LevelPattern[] = [
  ...easyPatterns,
  ...mediumPatterns,
  ...hardPatterns,
  ...specialPatterns,
];

export function getPatternsByDifficulty(difficulty: string): LevelPattern[] {
  switch (difficulty) {
    case 'easy':
      return easyPatterns;
    case 'medium':
      return mediumPatterns;
    case 'hard':
      return hardPatterns;
    case 'special':
      return specialPatterns;
    default:
      return allPatterns;
  }
}
