import './style.css';
import { HotelPhysics, initPhysics } from './game/physics';
import { HotelScene } from './game/scene';
import { HotelAudio } from './game/audio';
import { chargePower, damageBill, MAX_ANGLE, TARGET_COUNT, verdict } from './game/rules';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.dataset.state = 'loading';
app.innerHTML = `
  <div id="scene" class="scene"></div>
  <div class="vignette" aria-hidden="true"></div>
  <header class="header">
    <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="ホテル・アストラ ホーム"><span class="monogram">A<span>✦</span></span><span class="wordmark">HOTEL<span>A S T R A</span></span></a>
    <div class="header-center"><span class="live-dot"></span> THE LUGGAGE INCIDENT <span class="episode">/ 001</span></div>
    <button id="sound" class="sound-button" aria-pressed="false" aria-label="効果音をオンにする">♫ <span>SOUND OFF</span></button>
  </header>
  <main>
    <section class="intro" aria-labelledby="title">
      <div class="eyebrow"><span></span> WELCOME TO YOUR FIRST SHIFT</div>
      <p class="stars" aria-label="五つ星ホテル">✦ ✦ ✦ ✦ ✦</p>
      <h1 id="title">お荷物、<br><em>飛ばします。</em></h1>
      <p class="description">お客様に、忘れられない体験を。<br>少しだけ、力を込めすぎました。</p>
      <div class="tags"><span>3D PHYSICS COMEDY</span><span>1 PLAY ≈ 10 SEC</span></div>
    </section>
    <div class="scene-caption"><span class="caption-line"></span><span>THE GRAND LOBBY<small>本日の担当：あなた</small></span></div>
    <div id="toast" class="toast" role="status" aria-live="polite">お荷物の取り扱いには、ご注意ください。</div>
    <section class="controls" aria-label="ゲーム操作">
      <div class="aim-row"><label for="angle"><span class="step-number">01</span> 狙いを定める</label><output id="angle-value" for="angle">0°</output></div>
      <input id="angle" type="range" min="-${MAX_ANGLE}" max="${MAX_ANGLE}" step="1" value="0" aria-label="発射角度" />
      <div class="aim-hints"><span>LEFT</span><span>← → / A D</span><span>RIGHT</span></div>
      <button id="launch" class="launch-button" disabled><span class="charge-fill"></span><span class="launch-label"><span class="step-number">02</span> 長押しして、飛ばす <span class="launch-arrow">↗</span></span></button>
      <p class="control-help"><kbd>SPACE</kbd> 長押し → 離して発射 <span>·</span> <kbd>R</kbd> リトライ</p>
    </section>
    <aside class="damage-card" aria-label="今回のスコア">
      <div class="damage-heading"><span>YOUR HOSPITALITY</span><span class="tiny-star">✦</span></div>
      <p class="damage-label">本日の損害額</p>
      <strong id="damage" data-testid="damage">¥0</strong>
      <div class="damage-footer"><span>飛ばしたお荷物 <b id="knocked" data-testid="knocked">0</b><span class="muted"> / ${TARGET_COUNT}</span></span><span id="phase-label">READY TO SERVE</span></div>
    </aside>
  </main>
  <footer class="footer"><span>A SMALL GAME. A GRAND DISASTER.</span><span>PROTOTYPE 0.1 <span class="footer-dot">·</span> MADE FOR A LITTLE CHAOS</span></footer>
  <div id="loading" class="loading" role="status"><span class="loading-mark">A</span><p>ホテルを準備しています…</p></div>
  <dialog id="result" class="result-dialog" aria-labelledby="result-title">
    <div class="receipt-edge"></div><p class="result-eyebrow">HOTEL ASTRA / INCIDENT REPORT</p><p class="result-stars">✦ ✦ ✦ ✦ ✦</p>
    <h2 id="result-title"></h2><p id="result-description"></p>
    <div class="receipt"><span>本日の損害額</span><strong id="result-score" data-testid="result-score"></strong><div><span>お荷物</span><b id="result-knocked"></b></div><div><span>最高記録</span><b id="best-score"></b></div></div>
    <p class="result-note">※ 架空の損害額です。お給料からは引かれません。</p>
    <button id="retry" class="retry-button">もう一度、おもてなしする <span>↗</span></button><p class="retry-hint">PRESS R TO RETRY</p>
  </dialog>
`;

const query = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const launch = query<HTMLButtonElement>('#launch');
const angle = query<HTMLInputElement>('#angle');
const result = query<HTMLDialogElement>('#result');
const toast = query('#toast');
const sound = new HotelAudio();
const yen = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`;
let best = 0;
try {
  best = Math.max(0, Number(localStorage.getItem('astra-best')) || 0);
} catch {
  /* Storage is optional. */
}

async function start() {
  await initPhysics();
  const physics = new HotelPhysics();
  const scene = new HotelScene(query('#scene'));
  let chargingAt: number | undefined;
  let previous = performance.now();
  let previousKnocked = 0;
  let shownResult = false;
  let frame = 0;

  const updateAim = () => {
    query<HTMLOutputElement>('#angle-value').value =
      `${Number(angle.value) > 0 ? '+' : ''}${angle.value}°`;
    scene.aim(
      Number(angle.value),
      chargingAt === undefined ? 0.6 : chargePower(performance.now() - chargingAt),
    );
  };
  angle.addEventListener('input', updateAim);

  function beginCharge() {
    if (physics.phase !== 'ready' || chargingAt !== undefined) return;
    chargingAt = performance.now();
    launch.classList.add('charging');
    toast.textContent = 'そのおもてなし、もう少しためられます。';
  }
  function cancelCharge() {
    chargingAt = undefined;
    launch.classList.remove('charging');
    launch.style.setProperty('--charge', '0%');
  }
  function release() {
    if (chargingAt === undefined) return;
    const power = chargePower(performance.now() - chargingAt);
    cancelCharge();
    if (!physics.launch(Number(angle.value), power)) return;
    app.dataset.state = 'flying';
    launch.disabled = true;
    angle.disabled = true;
    query('#phase-label').textContent = 'SERVICE IN PROGRESS';
    toast.textContent = 'お客様のお荷物が、チェックアウトしました。';
    toast.classList.add('active');
    sound.play('launch');
  }
  function reset() {
    cancelCharge();
    result.close();
    physics.reset();
    shownResult = false;
    previousKnocked = 0;
    angle.value = '0';
    angle.disabled = false;
    launch.disabled = false;
    app.dataset.state = 'ready';
    query('#phase-label').textContent = 'READY TO SERVE';
    query('#damage').textContent = yen(0);
    query('#knocked').textContent = '0';
    toast.textContent = 'お荷物の取り扱いには、ご注意ください。';
    toast.classList.remove('active');
    updateAim();
    launch.focus({ preventScroll: true });
  }
  function showResult() {
    shownResult = true;
    app.dataset.state = 'result';
    query('#phase-label').textContent = 'SHIFT COMPLETE';
    const bill = damageBill(physics.knocked);
    const review = verdict(physics.knocked);
    best = Math.max(best, bill);
    try {
      localStorage.setItem('astra-best', String(best));
    } catch {
      /* A round does not require storage. */
    }
    query('#result-title').textContent = review.title;
    query('#result-description').textContent = review.description;
    query('#result-score').textContent = yen(bill);
    query('#result-knocked').textContent = `${physics.knocked} / ${TARGET_COUNT}`;
    query('#best-score').textContent = yen(best);
    result.showModal();
    query('#retry').focus();
    sound.play('bell');
  }

  launch.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    launch.setPointerCapture(event.pointerId);
    beginCharge();
  });
  launch.addEventListener('pointerup', release);
  launch.addEventListener('pointercancel', cancelCharge);
  launch.addEventListener('lostpointercapture', cancelCharge);
  window.addEventListener('blur', cancelCharge);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelCharge();
  });
  query('#retry').addEventListener('click', reset);
  result.addEventListener('cancel', (event) => {
    event.preventDefault();
    reset();
  });
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyR' && !event.repeat) {
      reset();
      return;
    }
    if (event.code === 'Space' && physics.phase === 'ready') {
      if (event.target instanceof HTMLButtonElement && event.target !== launch) return;
      event.preventDefault();
      if (!event.repeat) beginCharge();
    }
    if (physics.phase !== 'ready' || event.target === angle) return;
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
      event.preventDefault();
      const direction = event.code === 'ArrowLeft' || event.code === 'KeyA' ? -1 : 1;
      angle.value = String(
        Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, Number(angle.value) + direction)),
      );
      updateAim();
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      release();
    }
  });
  query('#sound').addEventListener('click', () => {
    const enabled = sound.toggle();
    query('#sound').setAttribute('aria-pressed', String(enabled));
    query('#sound').setAttribute(
      'aria-label',
      enabled ? '効果音をオフにする' : '効果音をオンにする',
    );
    query('#sound span').textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  });

  const tick = (now: number) => {
    const delta = document.hidden ? 0 : (now - previous) / 1000;
    previous = now;
    physics.step(delta);
    if (chargingAt !== undefined) {
      launch.style.setProperty('--charge', `${chargePower(now - chargingAt) * 100}%`);
      updateAim();
    }
    if (physics.knocked !== previousKnocked) {
      scene.impact();
      sound.play('impact');
      previousKnocked = physics.knocked;
      query('#damage').textContent = yen(damageBill(physics.knocked));
      query('#knocked').textContent = String(physics.knocked);
    }
    scene.render(physics, now / 1000);
    if (physics.phase === 'result' && !shownResult) showResult();
    frame = requestAnimationFrame(tick);
  };
  // Readiness means physics initialized AND a real WebGL frame was rendered.
  scene.render(physics, 0);
  query<HTMLCanvasElement>('#scene canvas').dataset.rendered = 'true';
  query('#loading').hidden = true;
  app.dataset.state = 'ready';
  launch.disabled = false;
  frame = requestAnimationFrame(tick);
  window.addEventListener(
    'pagehide',
    () => {
      cancelAnimationFrame(frame);
      scene.dispose();
      physics.dispose();
    },
    { once: true },
  );
}

start().catch((error) => {
  console.error('Hotel initialization failed:', error);
  app.dataset.state = 'error';
  const loading = query('#loading');
  loading.setAttribute('role', 'alert');
  loading.innerHTML =
    '<span class="loading-mark">A</span><h2>ホテルを開けませんでした</h2><p>WebGL 2対応のブラウザーで再読み込みしてください。<br>描画できない場合は、ブラウザーのグラフィック設定を確認してください。</p><button id="reload" class="retry-button">再読み込み</button>';
  query('#reload').addEventListener('click', () => location.reload());
});
