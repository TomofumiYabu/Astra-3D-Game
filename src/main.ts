import './style.css';
import { ThrowPhysics, initPhysics, type Pose } from './game/physics';
import { ThrowScene } from './game/scene';
import { ThrowAudio } from './game/audio';
import { saveResultCard } from './game/result-card';
import { chargePower, scoreRound, MAX_ANGLE, verdict, type RoundStats } from './game/rules';
import { STAGES, getStage, type Stage } from './game/stages';

const app = document.querySelector<HTMLDivElement>('#app')!;
const params = new URLSearchParams(location.search);
let stage = getStage(params.get('formation'));
const lowQuality = params.get('quality') === 'low';
app.dataset.state = 'loading';
app.innerHTML = `
  <div id="scene" class="scene"></div><div class="vignette" aria-hidden="true"></div>
  <header class="header">
    <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="それ、投げるんですか？ ホーム"><span class="brand-mark">↗</span><span>THROW<span>ANYTHING.</span></span></a>
    <span class="show-label"><i></i> ASTRA THROWING CHAMPIONSHIP <b>01</b></span>
    <div class="settings"><button id="quality" aria-label="${lowQuality ? '標準画質に切り替える' : '軽量画質に切り替える'}">画質：${lowQuality ? '軽量' : '標準'}</button><button id="sound" aria-pressed="false" aria-label="効果音をオンにする">♫ <span>音 OFF</span></button></div>
  </header>
  <main>
    <section class="intro" aria-labelledby="title">
      <p class="eyebrow"><span>CASE 001</span> CYBORG CLEANUP</p>
      <h1 id="title">本日の弾丸、<br><em>おじさん。</em></h1>
      <p class="description">サイボーグ軍団を、吹き飛ばせ。<br>本人は定時に帰りたいだけ。</p>
      <div class="specimen"><span class="specimen-dot"></span> HUMAN PROJECTILE <span>会社員 / 52歳</span></div>
    </section>
    <aside class="score-card" aria-label="今回のスコア"><span class="eyebrow">TOTAL SCORE</span><strong id="score" data-testid="score">0</strong><div class="score-details"><span>撃破 <b id="knocked" data-testid="knocked">0</b><small> / 18</small></span><span>連鎖 <b id="chain" data-testid="chain">0</b></span></div><p>最長吹き飛び <b id="distance">0.0</b> m</p></aside>
    <div class="impact-title" id="impact-title" aria-hidden="true"></div>
    <div class="round-caption" id="round-caption"><span class="caption-line"></span><span id="phase-label">READY TO THROW</span></div>
    <section class="controls" aria-label="ゲーム操作">
      <div class="formation-label">軍団の隊列 <span>FORMATION</span></div>
      <div class="formations" role="group" aria-label="隊列を選ぶ">${STAGES.map((item, i) => `<button data-formation="${item.id}" aria-pressed="${stage.id === item.id}"><span>0${i + 1}</span>${item.name}</button>`).join('')}</div>
      <div class="aim-row"><label for="angle">狙いを定める</label><output id="angle-value" for="angle">0°</output></div>
      <input id="angle" type="range" min="-${MAX_ANGLE}" max="${MAX_ANGLE}" step="1" value="0" aria-label="発射角度" />
      <div class="aim-hints"><span>← LEFT</span><span>← → / A D</span><span>RIGHT →</span></div>
      <button id="launch" class="launch-button" disabled><span class="charge-fill"></span><span class="launch-label"><span id="launch-text">長押しして、投げる</span><b>↗</b></span></button>
      <p class="control-help"><kbd>SPACE</kbd> ためて、離す <span>·</span> <kbd>R</kbd> やり直す</p>
    </section>
    <div class="field-notes"><span>ONE MAN. TOTAL CHAOS.</span><p>投げた敵が、次の敵を吹き飛ばす。<br>狙いを変えて、連鎖をつなげよう。</p></div>
    <p id="toast" class="toast" role="status" aria-live="polite"></p>
    <div id="replay-label" hidden>REPLAY <span>× 0.75</span><button id="stop-replay">結果へ戻る</button></div>
  </main>
  <footer><span>それ、投げるんですか？</span><span id="formation-code">001 / 正面突破</span></footer>
  <div id="loading" class="loading" role="status"><span class="loading-mark">↗</span><p>投擲会場を準備しています…</p></div>
  <dialog id="result" class="result-dialog" aria-labelledby="result-title">
    <div class="result-top"><span>THROW REPORT / 001</span><span>お疲れさまでした。</span></div>
    <div class="result-rank" id="rank">S</div><h2 id="result-title"></h2><p id="result-description"></p>
    <p class="result-score-label">TOTAL SCORE</p><strong id="result-score" data-testid="result-score"></strong>
    <div class="result-stats"><div><span>撃破</span><b id="result-knocked"></b></div><div><span>二次連鎖</span><b id="result-chain"></b></div><div><span>最長吹き飛び</span><b id="result-distance"></b></div></div>
    <p class="best-score">この隊列の最高記録 <b id="best-score"></b></p>
    <button id="retry" class="retry-button">もう一投、いきます。 <span>↗</span></button>
    <div class="result-actions"><button id="replay">今の一投を見る</button><button id="save-image">結果を画像で保存</button><button id="share">結果とお題URLをコピー</button></div>
    <p id="share-status" role="status"></p><input id="share-fallback" readonly aria-label="結果とお題URL" hidden />
    <p class="retry-hint">R でもう一投 · ESC で戻る</p>
  </dialog>`;

const query = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const launch = query<HTMLButtonElement>('#launch'),
  angle = query<HTMLInputElement>('#angle');
const result = query<HTMLDialogElement>('#result'),
  toast = query('#toast');
const sound = new ThrowAudio(),
  format = (value: number) => Math.round(value).toLocaleString('ja-JP');
const formationButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-formation]')];
let finalStats: RoundStats = { knocked: 0, chain: 0, depth: 0, distance: 0 };

async function start() {
  await initPhysics();
  const physics = new ThrowPhysics(stage),
    scene = new ThrowScene(query('#scene'), stage.targets.length);
  let chargingAt: number | undefined,
    previous = performance.now(),
    frame = 0;
  let encoreTime = 0,
    ending = false,
    shownResult = false,
    hitStop = 0,
    impactTimer = 0;
  let replayTime: number | undefined,
    replayIndex = 0;

  function paintScore(stats: RoundStats) {
    query('#score').textContent = format(scoreRound(stats));
    query('#knocked').textContent = String(stats.knocked);
    query('#chain').textContent = String(stats.chain);
    query('#distance').textContent = stats.distance.toFixed(1);
  }
  function updateAim() {
    query<HTMLOutputElement>('#angle-value').value =
      `${Number(angle.value) > 0 ? '+' : ''}${angle.value}°`;
    scene.aim(
      Number(angle.value),
      chargingAt === undefined ? 0.7 : chargePower(performance.now() - chargingAt),
      chargingAt !== undefined,
    );
  }
  function cancelCharge() {
    chargingAt = undefined;
    launch.classList.remove('charging');
    launch.style.setProperty('--charge', '0%');
    query('#launch-text').textContent = '長押しして、投げる';
    updateAim();
  }
  function beginCharge() {
    if (physics.phase !== 'ready' || chargingAt !== undefined) return;
    chargingAt = performance.now();
    launch.classList.add('charging');
    toast.textContent = 'いい感じです。そのまま、ためて。';
  }
  function release() {
    if (chargingAt === undefined) return;
    const power = chargePower(performance.now() - chargingAt);
    cancelCharge();
    if (!physics.launch(Number(angle.value), power)) return;
    app.dataset.state = 'flying';
    launch.disabled = true;
    angle.disabled = true;
    formationButtons.forEach((button) => (button.disabled = true));
    query('#phase-label').textContent = 'HUMAN INCOMING';
    toast.textContent = 'いってらっしゃい、おじさん。';
    sound.play('launch');
  }
  function reset(next: Stage = stage) {
    stage = next;
    cancelCharge();
    result.close();
    physics.reset(stage);
    scene.reset();
    ending = false;
    shownResult = false;
    encoreTime = 0;
    replayTime = undefined;
    replayIndex = 0;
    hitStop = 0;
    impactTimer = 0;
    query('#replay-label').hidden = true;
    query('#impact-title').classList.remove('active');
    query('#share-fallback').hidden = true;
    query('#share-status').textContent = '';
    angle.value = '0';
    angle.disabled = false;
    launch.disabled = false;
    app.dataset.state = 'ready';
    formationButtons.forEach((button) => {
      button.disabled = false;
      button.setAttribute('aria-pressed', String(button.dataset.formation === stage.id));
    });
    query('#phase-label').textContent = 'READY TO THROW';
    query('#formation-code').textContent = `00${STAGES.indexOf(stage) + 1} / ${stage.name}`;
    toast.textContent = stage.hint;
    paintScore(physics.stats);
    updateAim();
    launch.focus({ preventScroll: true });
  }
  function showResult() {
    shownResult = true;
    app.dataset.state = 'result';
    query('#replay-label').hidden = true;
    query('#phase-label').textContent = 'MISSION COMPLETE';
    finalStats = physics.stats;
    paintScore(finalStats);
    const score = scoreRound(finalStats),
      review = verdict(finalStats);
    let best = score;
    try {
      const saved = Number(localStorage.getItem(`astra-throw-best-${stage.id}`));
      best = Math.max(score, Number.isFinite(saved) ? saved : 0);
      localStorage.setItem(`astra-throw-best-${stage.id}`, String(best));
    } catch {
      /* Optional storage. */
    }
    query('#rank').textContent = review.rank;
    query('#result-title').textContent = review.title;
    query('#result-description').textContent = review.description;
    query('#result-score').textContent = format(score);
    query('#result-knocked').textContent = `${finalStats.knocked} / ${stage.targets.length}`;
    query('#result-chain').textContent = String(finalStats.chain);
    query('#result-distance').textContent = `${finalStats.distance.toFixed(1)} m`;
    query('#best-score').textContent = format(best);
    if (!result.open) result.showModal();
    query('#retry').focus();
    sound.play('bell');
  }
  function startReplay() {
    if (physics.frames.length < 2) return;
    result.close();
    scene.reset();
    replayTime = 0;
    replayIndex = 0;
    shownResult = false;
    ending = false;
    encoreTime = 0;
    app.dataset.state = 'replay';
    query('#replay-label').hidden = false;
    query('#phase-label').textContent = 'ACTION REPLAY';
    toast.textContent = 'その一投を、もう一度。';
  }
  angle.addEventListener('input', updateAim);
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
  query('#retry').addEventListener('click', () => reset());
  query('#replay').addEventListener('click', startReplay);
  query('#stop-replay').addEventListener('click', () => {
    replayTime = undefined;
    ending = true;
    encoreTime = 2;
    showResult();
  });
  result.addEventListener('cancel', (event) => {
    event.preventDefault();
    reset();
  });
  formationButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const next = getStage(button.dataset.formation!);
      const url = new URL(location.href);
      url.searchParams.set('formation', next.id);
      history.replaceState(null, '', url);
      reset(next);
    }),
  );
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement && event.target !== angle) return;
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
      const direction = ['ArrowLeft', 'KeyA'].includes(event.code) ? -1 : 1;
      angle.value = String(
        Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, Number(angle.value) + direction)),
      );
      updateAim();
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space' && chargingAt !== undefined) {
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
    query('#sound span').textContent = enabled ? '音 ON' : '音 OFF';
  });
  query('#quality').addEventListener('click', () => {
    const url = new URL(location.href);
    if (lowQuality) url.searchParams.delete('quality');
    else url.searchParams.set('quality', 'low');
    location.assign(url);
  });
  query('#save-image').addEventListener('click', async () => {
    const button = query<HTMLButtonElement>('#save-image');
    button.disabled = true;
    try {
      await saveResultCard(scene.snapshot(1280, 720), { ...finalStats }, stage);
      query('#share-status').textContent = '結果画像の保存を開始しました。';
    } catch {
      query('#share-status').textContent = '画像を保存できませんでした。結果のコピーも使えます。';
    } finally {
      button.disabled = false;
    }
  });
  query('#share').addEventListener('click', async () => {
    const url = new URL(import.meta.env.BASE_URL, location.href);
    url.searchParams.set('formation', stage.id);
    const text = `本日の弾丸、おじさん。${format(scoreRound(finalStats))}点 / ${finalStats.knocked}体撃破 / ${finalStats.chain}連鎖！\n同じ隊列「${stage.name}」に挑戦：${url.href}`;
    try {
      await navigator.clipboard.writeText(text);
      query('#share-status').textContent = 'コピーしました。好きな場所に貼り付けられます。';
    } catch {
      const field = query<HTMLInputElement>('#share-fallback');
      field.hidden = false;
      field.value = text;
      field.focus();
      field.select();
      query('#share-status').textContent = 'この欄を選択してコピーしてください。';
    }
  });

  const tick = (now: number) => {
    const delta = document.hidden ? 0 : Math.min(0.5, Math.max(0, (now - previous) / 1000));
    previous = now;
    let pose: Pose = physics.transforms,
      view: 'ready' | 'flying' | 'encore' = physics.phase === 'ready' ? 'ready' : 'flying';
    if (replayTime !== undefined) {
      replayTime += delta * 0.75;
      while (
        replayIndex < physics.frames.length - 1 &&
        physics.frames[replayIndex + 1].time <= replayTime
      )
        replayIndex++;
      const recorded = physics.frames[replayIndex];
      pose = recorded.pose;
      paintScore(recorded.stats);
      if (replayTime >= physics.frames[physics.frames.length - 1].time) {
        replayTime = undefined;
        ending = true;
        encoreTime = 0;
      }
    } else if (!ending && physics.phase === 'flying') {
      if (hitStop > 0) hitStop = Math.max(0, hitStop - delta);
      else physics.step(delta);
      pose = physics.transforms;
      const impacts = physics.drainImpacts();
      if (impacts.length) {
        scene.impact(impacts);
        sound.play(
          'impact',
          impacts.some((event) => event.chain),
        );
        hitStop = 0.045;
        query('#impact-title').textContent =
          physics.stats.chain > 0 ? `${physics.stats.chain} CHAIN!` : 'NICE THROW!';
        query('#impact-title').classList.add('active');
        impactTimer = 0.65;
      }
      paintScore(physics.stats);
      if (physics.finished) {
        ending = true;
        encoreTime = 0;
        app.dataset.state = 'encore';
        toast.textContent = 'お疲れさまでした。ネクタイ、曲がってます。';
      }
    }
    if (ending) {
      encoreTime += delta;
      pose = physics.transforms;
      view = 'encore';
      if (encoreTime >= 2.2 && !shownResult) showResult();
    }
    impactTimer -= delta;
    if (impactTimer <= 0) query('#impact-title').classList.remove('active');
    if (chargingAt !== undefined) {
      const power = chargePower(now - chargingAt);
      launch.style.setProperty('--charge', `${power * 100}%`);
      query('#launch-text').textContent = power >= 1 ? '最大パワー！ 離して発射' : 'ためています…';
      updateAim();
    }
    scene.render(pose, view, now / 1000, encoreTime);
    frame = requestAnimationFrame(tick);
  };
  scene.render(physics.transforms, 'ready', 0);
  query<HTMLCanvasElement>('#scene canvas').dataset.rendered = 'true';
  query('#loading').hidden = true;
  reset(stage);
  frame = requestAnimationFrame(tick);
  window.addEventListener('pagehide', (event) => {
    // A page in the back/forward cache must retain its scene when restored.
    if (event.persisted) return;
    cancelAnimationFrame(frame);
    scene.dispose();
    physics.dispose();
    sound.dispose();
  });
}
start().catch((error) => {
  console.error('Throwing arena initialization failed:', error);
  app.dataset.state = 'error';
  const loading = query('#loading');
  loading.setAttribute('role', 'alert');
  loading.innerHTML =
    '<span class="loading-mark">↗</span><h2>会場を開けませんでした</h2><p>WebGL 2対応のブラウザーで再読み込みしてください。<br>ブラウザーのグラフィック設定も確認できます。</p><button id="reload" class="retry-button">再読み込み</button>';
  query('#reload').addEventListener('click', () => location.reload());
});
