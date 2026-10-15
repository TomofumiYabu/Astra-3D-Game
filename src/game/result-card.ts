import { scoreRound, verdict, type RoundStats } from './rules';
import type { Stage } from './stages';

/** Composite a local PNG. No upload, screenshot service, or third-party assets. */
export async function saveResultCard(canvas: HTMLCanvasElement, stats: RoundStats, stage: Stage) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the result image');
  const { width, height } = canvas;
  const shade = context.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(9, 29, 44, .88)');
  shade.addColorStop(0.32, 'rgba(9, 29, 44, .05)');
  shade.addColorStop(0.57, 'rgba(9, 29, 44, .05)');
  shade.addColorStop(1, 'rgba(9, 29, 44, .97)');
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);
  const label = (text: string, x: number, y: number, size: number, color = '#f4efe1') => {
    context.fillStyle = color;
    context.font = `700 ${size}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`;
    context.fillText(text, x, y);
  };
  context.strokeStyle = '#ffd17d';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(48, 51);
  context.lineTo(62, 37);
  context.moveTo(49, 37);
  context.lineTo(62, 37);
  context.lineTo(62, 50);
  context.stroke();
  label('THROW ANYTHING.', 77, 50, 20, '#ffd17d');
  label('本日の弾丸、おじさん。', 46, 112, 44);
  label('本人は定時に帰りたいだけ。', 48, 147, 20);
  const score = scoreRound(stats).toLocaleString('ja-JP');
  label(`${score} POINTS`, 46, 566, 64, '#ffd17d');
  label(
    `${stats.knocked}体撃破   /   ${stats.chain}連鎖   /   ${stats.distance.toFixed(1)}m`,
    48,
    611,
    28,
  );
  label(`隊列：${stage.name}`, 49, 654, 20);
  context.fillStyle = 'rgba(244, 239, 225, .3)';
  context.fillRect(48, 672, width - 96, 1);
  label('それ、投げるんですか？', 48, 702, 16);
  context.textAlign = 'right';
  label(`${verdict(stats).rank} RANK`, width - 48, 605, 52, '#ffd17d');
  const url = new URL(import.meta.env.BASE_URL, location.href);
  label(`${url.host}${url.pathname}`, width - 48, 702, 16);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('PNG encoding failed'))),
      'image/png',
    ),
  );
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `throw-anything-${stage.id}-${scoreRound(stats)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}
