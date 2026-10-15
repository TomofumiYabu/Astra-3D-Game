export const MAX_ANGLE = 22;
export const CHARGE_MS = 1500;
export const ROUND_SECONDS = 6;
export const FIXED_STEP = 1 / 60;
export const TARGET_COUNT = 10;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function chargePower(elapsedMs: number): number {
  return clamp(elapsedMs / CHARGE_MS, 0.15, 1);
}

export function launchVelocity(angleDegrees: number, power: number) {
  const angle = (clamp(angleDegrees, -MAX_ANGLE, MAX_ANGLE) * Math.PI) / 180;
  const speed = 14 + clamp(power, 0.15, 1) * 10;
  return { x: Math.sin(angle) * speed, y: 3, z: -Math.cos(angle) * speed };
}

export function damageBill(knocked: number): number {
  const count = Math.floor(clamp(knocked, 0, TARGET_COUNT));
  return count * 48_000 + Math.max(0, count - 2) * 12_000;
}

export function verdict(knocked: number): { title: string; description: string } {
  if (knocked >= 8)
    return {
      title: '伝説のおもてなし。',
      description: 'ホテルの歴史に、消せない一日が刻まれました。',
    };
  if (knocked >= 4)
    return {
      title: '支配人がお呼びです。',
      description: 'お客様のお荷物は、無事に宙を舞いました。',
    };
  if (knocked > 0)
    return {
      title: '少々、手が滑りました。',
      description: 'あと少しの勢いで、もっと忘れられないサービスに。',
    };
  return { title: '今日も平和なホテル。', description: '正面を狙って、もう少しためてみましょう。' };
}
