import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HotelPhysics, initPhysics, START, TARGET_POSITIONS } from '../../src/game/physics';
import { FIXED_STEP } from '../../src/game/rules';

describe('real Rapier world', () => {
  let game: HotelPhysics;
  beforeAll(async () => {
    await initPhysics();
  });
  beforeEach(() => {
    game = new HotelPhysics();
  });
  afterEach(() => {
    game.dispose();
  });

  it('starts with a stable tower and no phantom points', () => {
    expect(game.transforms.targets).toHaveLength(10);
    game.transforms.targets.forEach((target, index) => {
      expect(target.position.y).toBeCloseTo(TARGET_POSITIONS[index].y, 0);
    });
    for (let i = 0; i < 360; i++) game.step(FIXED_STEP);
    expect(game.phase).toBe('ready');
    expect(game.knocked).toBe(0);
    expect(game.transforms.projectile.position.z).toBeCloseTo(START.z);
  });

  it('launches, collides with real bodies, and completes exactly one round', () => {
    expect(game.launch(0, 1)).toBe(true);
    expect(game.launch(0, 1)).toBe(false);
    for (let i = 0; i < 380; i++) game.step(FIXED_STEP);
    expect(game.phase).toBe('result');
    expect(game.knocked).toBeGreaterThanOrEqual(4);
    expect(game.knocked).toBeLessThanOrEqual(10);
    expect(game.transforms.projectile.position.z).toBeLessThan(START.z - 5);
    const final = game.transforms;
    game.step(0.1);
    expect(game.transforms).toEqual(final);
  });

  it('restores the tower, projectile, clock, and score when retrying', () => {
    const initial = game.transforms;
    game.launch(0, 1);
    for (let i = 0; i < 380; i++) game.step(FIXED_STEP);
    expect(game.knocked).toBeGreaterThan(0);
    game.reset();
    expect(game.phase).toBe('ready');
    expect(game.elapsed).toBe(0);
    expect(game.knocked).toBe(0);
    expect(game.transforms).toEqual(initial);
    expect(game.launch(0, 0.5)).toBe(true);
  });

  it('produces the same physics at 30 and 60 render frames per second', () => {
    game.launch(0, 0.8);
    for (let i = 0; i < 120; i++) game.step(FIXED_STEP);
    const sixty = game.transforms;
    game.reset();
    game.launch(0, 0.8);
    for (let i = 0; i < 60; i++) game.step(2 * FIXED_STEP);
    expect(game.transforms).toEqual(sixty);
  });
});
