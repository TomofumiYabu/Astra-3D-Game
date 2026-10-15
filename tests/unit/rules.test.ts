import { describe, expect, it } from 'vitest';
import { chargePower, scoreRound, launchVelocity, MAX_ANGLE, verdict } from '../../src/game/rules';
import { getStage, STAGES } from '../../src/game/stages';

describe('throw controls and scoring', () => {
  it('makes short taps usable, caps long holds, and safely handles invalid input', () => {
    expect(chargePower(0)).toBe(0.2);
    expect(chargePower(600)).toBe(0.5);
    expect(chargePower(9000)).toBe(1);
    expect(chargePower(NaN)).toBe(0.2);
    expect(chargePower(-100)).toBe(0.2);
  });
  it('steers symmetrically while maintaining speed and bounding the angle', () => {
    const left = launchVelocity(-MAX_ANGLE, 1),
      right = launchVelocity(MAX_ANGLE, 1);
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.z).toBeCloseTo(right.z);
    expect(Math.hypot(right.x, right.z)).toBeCloseTo(32);
    expect(launchVelocity(900, 1)).toEqual(right);
    expect(launchVelocity(0, 0.2).z).toBeGreaterThan(launchVelocity(0, 1).z);
  });
  it('rewards secondary collisions and distance beyond a fixed body count', () => {
    const simple = { knocked: 5, chain: 0, depth: 1, distance: 3 };
    expect(scoreRound(simple)).toBe(5300);
    expect(scoreRound({ ...simple, chain: 3, depth: 3 })).toBeGreaterThan(scoreRound(simple));
    expect(scoreRound({ ...simple, distance: 20 })).toBeGreaterThan(scoreRound(simple));
    expect(scoreRound({ knocked: 0, chain: 0, depth: 0, distance: 25 })).toBe(0);
  });
  it('distinguishes a miss, an ordinary hit and a spectacular clear', () => {
    expect(verdict({ knocked: 0, chain: 0, depth: 0, distance: 0 }).rank).toBe('—');
    expect(verdict({ knocked: 5, chain: 0, depth: 1, distance: 5 }).rank).toBe('B');
    expect(verdict({ knocked: 16, chain: 8, depth: 4, distance: 20 }).rank).toBe('S');
  });
  it('resolves shared formations and rejects unknown IDs without executing arbitrary data', () => {
    expect(getStage('pincer')).toBe(STAGES[1]);
    expect(getStage('<script>')).toBe(STAGES[0]);
    expect(new Set(STAGES.map((stage) => JSON.stringify(stage.targets))).size).toBe(3);
  });
});
