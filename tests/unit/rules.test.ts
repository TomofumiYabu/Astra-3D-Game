import { describe, expect, it } from 'vitest';
import { chargePower, damageBill, launchVelocity, MAX_ANGLE, verdict } from '../../src/game/rules';

describe('charge and aim', () => {
  it('gives a short tap a usable minimum and caps a long hold', () => {
    expect(chargePower(0)).toBe(0.15);
    expect(chargePower(750)).toBe(0.5);
    expect(chargePower(5000)).toBe(1);
    expect(chargePower(-100)).toBe(0.15);
  });
  it('preserves forward speed while steering symmetrically and clamps aim', () => {
    const left = launchVelocity(-MAX_ANGLE, 1);
    const right = launchVelocity(MAX_ANGLE, 1);
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.z).toBeCloseTo(right.z);
    expect(Math.hypot(right.x, right.z)).toBeCloseTo(24);
    expect(launchVelocity(900, 1)).toEqual(right);
    expect(launchVelocity(0, 0.2).z).toBeGreaterThan(launchVelocity(0, 1).z);
  });
});

describe('incident report', () => {
  it('charges only for displaced luggage and awards a multi-hit bonus', () => {
    expect(damageBill(0)).toBe(0);
    expect(damageBill(1)).toBe(48_000);
    expect(damageBill(4)).toBe(216_000);
    expect(damageBill(10)).toBe(576_000);
    expect(damageBill(-1)).toBe(0);
    expect(damageBill(100)).toBe(damageBill(10));
  });
  it('distinguishes a miss from a successful and exceptional round', () => {
    expect(verdict(0).title).toBe('今日も平和なホテル。');
    expect(verdict(4).title).toBe('支配人がお呼びです。');
    expect(verdict(10).title).toBe('伝説のおもてなし。');
  });
});
