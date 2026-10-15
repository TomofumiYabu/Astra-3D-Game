export const MAX_ANGLE = 24;
export const CHARGE_MS = 1200;
export const FIXED_STEP = 1 / 60;
export const MIN_ROUND_SECONDS = 5;
export const ROUND_SECONDS = 8;
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
export function chargePower(elapsedMs: number): number {
  return clamp(elapsedMs / CHARGE_MS, 0.2, 1);
}
export function launchVelocity(angleDegrees: number, power: number) {
  const angle = (clamp(angleDegrees, -MAX_ANGLE, MAX_ANGLE) * Math.PI) / 180;
  const speed = 20 + clamp(power, 0.2, 1) * 12;
  return { x: Math.sin(angle) * speed, y: 3.1, z: -Math.cos(angle) * speed };
}
export type RoundStats = { knocked: number; chain: number; depth: number; distance: number };
export function scoreRound(stats: RoundStats): number {
  const count = Math.max(0, Math.floor(stats.knocked));
  if (!count) return 0;
  return (
    count * 1000 +
    Math.max(0, Math.floor(stats.chain)) * 600 +
    Math.max(0, Math.floor(stats.depth) - 1) * 300 +
    Math.round(clamp(stats.distance, 0, 200) * 100)
  );
}
export function verdict(stats: RoundStats): { title: string; description: string; rank: string } {
  if (stats.knocked >= 15)
    return {
      title: 'おじさん、世界を救う。',
      description: '本人は、定時に帰りたかっただけ。',
      rank: 'S',
    };
  if (stats.chain >= 5)
    return {
      title: '連鎖する、社会人。',
      description: '一人の出勤が、軍団の退勤になりました。',
      rank: 'A',
    };
  if (stats.knocked >= 5)
    return {
      title: '本日の仕事、完了。',
      description: 'ネクタイを直して、何事もなかった顔。',
      rank: 'B',
    };
  if (stats.knocked)
    return {
      title: 'まだ、いけます。',
      description: '少し狙いを変えると、次の集団まで届くかも。',
      rank: 'C',
    };
  return {
    title: 'ただいま空振り。',
    description: 'まずは正面へ。しっかりためて、離してみよう。',
    rank: '—',
  };
}
