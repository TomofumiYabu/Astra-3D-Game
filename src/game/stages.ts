export type Position = { x: number; y: number; z: number };
export type FormationId = 'breakthrough' | 'pincer' | 'domino';
export type Stage = { id: FormationId; name: string; hint: string; targets: Position[] };
const point = (x: number, z: number): Position => ({ x, y: 1.22, z });
export const START: Position = { x: 0, y: 1.34, z: 10 };
export const STAGES: Stage[] = [
  {
    id: 'breakthrough',
    name: '正面突破',
    hint: 'まずは正面へ。軍団の真ん中をぶち抜こう。',
    targets: Array.from({ length: 6 }, (_, row) =>
      [-1.35, 0, 1.35].map((x) => point(x, -row * 1.95)),
    ).flat(),
  },
  {
    id: 'pincer',
    name: '左右包囲',
    hint: '左右のかたまりを狙って、横へ連鎖させよう。',
    targets: [-1, 1].flatMap((side) =>
      Array.from({ length: 3 }, (_, row) =>
        [0, 1, 2].map((col) => point(side * (1.1 + col * 1.25), -row * 2 - col * 0.35)),
      ).flat(),
    ),
  },
  {
    id: 'domino',
    name: '千鳥ドミノ',
    hint: '少し斜めから。ジグザグの隊列をつなげよう。',
    targets: Array.from({ length: 6 }, (_, row) =>
      [-1.3, 0, 1.3].map((x) => point(x + (row % 2 ? 0.65 : -0.65), -row * 1.85)),
    ).flat(),
  },
];
export function getStage(id: string | null): Stage {
  return STAGES.find((stage) => stage.id === id) ?? STAGES[0];
}
