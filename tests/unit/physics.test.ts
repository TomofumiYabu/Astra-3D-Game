import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ThrowPhysics, initPhysics } from '../../src/game/physics';
import { START, STAGES } from '../../src/game/stages';
import { FIXED_STEP, scoreRound } from '../../src/game/rules';
const finish = (game: ThrowPhysics) => {
  for (let i = 0; i < 500 && !game.finished; i++) game.step(FIXED_STEP);
};

describe('real Rapier throwing arena', () => {
  let game: ThrowPhysics;
  beforeAll(initPhysics);
  beforeEach(() => {
    game = new ThrowPhysics();
  });
  afterEach(() => game.dispose());
  it('keeps the waiting army stable and does not award phantom points', () => {
    expect(game.transforms.targets).toHaveLength(18);
    for (let i = 0; i < 360; i++) game.step(FIXED_STEP);
    expect(game.phase).toBe('ready');
    expect(game.stats.knocked).toBe(0);
    expect(game.drainImpacts()).toEqual([]);
    expect(game.transforms.projectile.position.z).toBe(START.z);
    game.transforms.targets.forEach((target, index) =>
      expect(target.position.y).toBeCloseTo(STAGES[0].targets[index].y, 1),
    );
  });
  it('transfers a real hit into secondary collisions and scores each target once', () => {
    expect(game.launch(0, 1)).toBe(true);
    expect(game.launch(0, 1)).toBe(false);
    finish(game);
    expect(game.finished).toBe(true);
    expect(game.stats.knocked).toBeGreaterThanOrEqual(10);
    expect(game.stats.chain).toBeGreaterThanOrEqual(5);
    expect(game.stats.chain).toBeLessThan(game.stats.knocked);
    expect(game.stats.depth).toBeGreaterThanOrEqual(3);
    expect(game.stats.distance).toBeGreaterThan(5);
    const events = game.drainImpacts();
    expect(new Set(events.map((event) => event.index)).size).toBe(events.length);
    expect(events).toHaveLength(game.stats.knocked);
    expect(events.some((event) => event.chain)).toBe(true);
    const final = game.transforms,
      score = scoreRound(game.stats);
    game.step(100);
    expect(game.transforms).toEqual(final);
    expect(scoreRound(game.stats)).toBe(score);
    expect(game.drainImpacts()).toEqual([]);
  });
  it('a clean miss cannot activate an army or produce secondary explosions', () => {
    game.launch(24, 1);
    finish(game);
    expect(game.stats.knocked).toBe(0);
    expect(game.stats.chain).toBe(0);
    expect(game.drainImpacts()).toEqual([]);
  });
  it('reset removes all impacts, replay data, momentum and score', () => {
    const original = game.transforms;
    game.launch(0, 1);
    finish(game);
    expect(game.frames.length).toBeGreaterThan(100);
    game.reset();
    expect(game.phase).toBe('ready');
    expect(game.elapsed).toBe(0);
    expect(game.stats.knocked).toBe(0);
    expect(game.frames).toEqual([]);
    expect(game.drainImpacts()).toEqual([]);
    expect(game.transforms).toEqual(original);
    expect(game.launch(0, 0.5)).toBe(true);
  });
  it.each([30, 2])('maintains identical physics with %i fps rendering', (fps) => {
    game.launch(0, 0.8);
    for (let i = 0; i < 120; i++) game.step(FIXED_STEP);
    const pose = game.transforms,
      stats = game.stats;
    game.reset();
    game.launch(0, 0.8);
    for (let i = 0; i < 2 * fps; i++) game.step(1 / fps);
    expect(game.transforms).toEqual(pose);
    expect(game.stats).toEqual(stats);
  });
  it('bounds long stalls and ignores nonfinite or backwards frame times', () => {
    game.launch(0, 1);
    game.step(NaN);
    game.step(Infinity);
    game.step(-3);
    expect(game.elapsed).toBe(0);
    game.step(120);
    expect(game.elapsed).toBeCloseTo(0.5);
    expect(game.phase).toBe('flying');
  });
  it('records snapshots rather than mutable references, preserving the actual throw', () => {
    game.launch(0, 1);
    const first = structuredClone(game.frames[0]);
    finish(game);
    expect(game.frames[0]).toEqual(first);
    const last = game.frames.at(-1)!;
    expect(last.pose).toEqual(game.transforms);
    expect(last.stats).toEqual(game.stats);
    expect(last.time).toBe(game.elapsed);
  });
  it('aiming and changing formations produces different outcomes, with bounded finite poses', () => {
    const outcomes = new Set<string>();
    for (const stage of STAGES)
      for (const angle of [-8, 0, 8]) {
        game.reset(stage);
        game.launch(angle, 1);
        finish(game);
        expect(game.frames.at(-1)?.pose).toEqual(game.transforms);
        expect(game.frames.at(-1)?.stats).toEqual(game.stats);
        outcomes.add(
          `${game.stats.knocked}:${game.stats.chain}:${Math.round(game.stats.distance)}`,
        );
        expect(game.stats.knocked).toBeLessThanOrEqual(stage.targets.length);
        for (const transform of [game.transforms.projectile, ...game.transforms.targets]) {
          expect(Object.values(transform.position).every(Number.isFinite)).toBe(true);
          expect(Math.abs(transform.position.x)).toBeLessThan(150);
          expect(Math.abs(transform.position.z)).toBeLessThan(150);
        }
      }
    expect(outcomes.size).toBeGreaterThanOrEqual(3);
  });
});
