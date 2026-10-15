# 引継ぎ書 — One Giant Rescue

更新日: 2026-10-16（日本時間）。新企画の仮題: **『猫を降ろすだけ。— 巨大化は一回だけ』**。

この文書だけで、別のCodex Cloudセッションから独立プロジェクトを開始できるようにする。現行の投擲ゲームとは別の企画・Gitリポジトリ・Cloud環境で進める。

## 現在の状態と依頼

- ユーザーが最終指定した今回の範囲は **引継ぎ書の保存まで**。新しいGitHubリポジトリの作成・独立Cloud環境の構築は、次のセッションで進める。
- 新しいリポジトリ名は `TomofumiYabu/One-Giant-Rescue` として準備する。検討用の初期公開範囲はprivate。ゲームの一般公開先やリポジトリの公開範囲変更は、後の公開作業で決める。
- 今回、GitHubの既存認証で所有者が `TomofumiYabu` であることを確認した。新規作成はGraphQLの `createRepository` とRESTの `POST /user/repos` がともに `Resource not accessible by integration` で拒否された。新リポジトリの作成成功・push成功はまだ確認できていない。
- 次にリポジトリを作成するときは、所有者による空のprivateリポジトリ作成、または連携アプリの新規作成権限の解決が必要。秘密情報をチャットへ貼る必要はない。リポジトリが作られたら、既存認証で読み取りとpushをそれぞれ再確認する。
- 新ゲームのソースコード、依存ロック、Cloud環境の登録・公開、ゲームの公開は未実施。引継ぎ文書内の予定を実行済みと解釈しない。

参照元は `TomofumiYabu/Astra-3D-Game`、開発基盤の参照コミットは `e0408f90c272225885127b9f4d2c75a565a6be15`。そのコミットのホテル試作はCloudとGitHub Actionsで14件のテストが成功し、実公開URLの一ラウンドも確認済み。この結果は新ゲームの動作保証ではない。

## 企画の核

屋上の猫を助けるため、街にある物を **一つだけ巨大化** する。猫の救出という分かりやすい目的と、助け方の異常さ、周囲の大惨事を同じ画面で見せる。

最初の絵は、屋上の小さい猫と路上の脚立。脚立が建物ほどに伸びて橋になり、周囲の看板や車を巻き込みながら猫の救出経路ができる。巨大化は準備中に調整できるが、実行すると選んだ一つだけが大きくなり、一度の結果へ進む。

プレイヤーが考えることは「何を」「どこまで」「どちらへ」大きくするか。大きくすれば必ず成功するのではなく、橋が届かない・ちょうど届く・重心が崩れる、という違いを作る。同じお題に別の道具や大きさで挑戦できる構造を目指す。

仮の一本の動画: 猫を見上げる → 小さな脚立を選ぶ → ビルほどに伸ばす → 看板が外れ、脚立が橋になる → 猫がクッションへ到着 → 背後で街の物が倒れる。

## 最初に作る一場面

- PCブラウザー、一人用、一街区、固定カメラ、一匹の猫、一つの到達先。
- 道具は脚立だけ。選択UIを無理に作らず、大きさと向きの調整から始める。
- 最初は静的な建物2つ、小物と大きくなる道具を含め20〜30個程度以内の動く剛体を目安にする。これは性能検証済みの上限値ではない。
- 状態は loading → planning → growing → resolving → result。エラー時は案内を出す。Rキーとボタンで初期状態へ戻す。
- planningで方向と倍率を変更し、Spaceまたは実行ボタンで確定。実行中の二重入力を防ぐ。
- 結果は救出の成否と周辺被害を分けて表示する。小物を壊しただけで救出成功と判定しない。
- 猫はプロシージャルな仮モデルでよい。最初から写実的な毛や複雑なAIを必須にしない。負傷表現より、助かった結果と周辺の滑稽さを主役にする。
- 本物の都市全壊、流体、大勢の歩行者、多人プレイ、オンラインランキングは初期範囲に含めない。

### 物理と猫の移動を成立させる方法

巨大化中のコライダー変更は接触の食い込みや急激な押し出しを起こしやすい。初期の脚立には、倍率の上下限、接触を見ながら進める成長の刻み、伸びる方向を設ける。見た目だけを拡大して、当たり判定を小さいままにしない。外観の面積に応じて無制限に質量を増やすこともしない。

倍率と質量の関係、接触を起点にした押し出しの上限を決め、同じ入力で試験可能にする。最初の道具で物理が安定してから、傘やマットを追加する。成長の表現を連続スケールにするか、制御された形状更新にするかは、その検証結果で選ぶ。

猫の救出は、画面上で道具や足場が作った経路と、到達先への接触を確認して判定する。最初は一場面専用の経路判定と短い移動演出で成立させてよいが、離れた場所へ突然移して成功にしない。必要な橋がない場合は移動しない。猫の状態もリセット対象にする。

## アートと拡張

ミニチュア特撮のように、一街区と一匹の猫を見渡せる構図にする。主役の大きさが比較できるドア・車・看板を残す。材質・光・適度な被写界深度を狭い画角へ集中する。

道具追加は見た目の差だけにしない。脚立は橋、傘は受け止め、マットは着地支援、と救出方法の違いを設計する。お題コード、最少被害への挑戦、リプレイは一場面の面白さを確認した後に追加する。

既存作品の素材を無断使用しない。導入するモデル・音・テクスチャの出典とライセンスを `docs/ASSETS.md` に記録する。

## 新しいリポジトリの構成

新Cloud環境での標準作業場所は `/workspace/One-Giant-Rescue`。実際の環境が別の場所へチェックアウトした場合は、実パスを確認して設定と文書を合わせる。現在のAstra環境のリポジトリ一覧や起動先を置き換えない。

```text
AGENTS.md
README.md
.node-version
.npmrc
package.json
package-lock.json
vite.config.ts
playwright.config.ts
playwright.static.config.ts
src/main.ts
src/style.css
src/game/rules.ts
src/game/physics.ts
src/game/scene.ts
tests/unit/
tests/e2e/
tests/static/
scripts/serve-static.mjs
docs/HANDOFF.md
docs/SPEC.md
docs/ARCHITECTURE.md
docs/DEVELOPMENT.md
docs/PROGRESS.md
docs/ASSETS.md
```

初期リポジトリはREADME・AGENTS・この引継ぎ書から始める。本書を新リポジトリの `docs/HANDOFF.md` として保存する。残りは次セッションで最小実装とともに作成する。ホテルのUI・損害額ルール・名称・公開済みという文言を丸ごとコピーしない。参照元の `.git`、秘密情報、node_modules、生成物をコピーしない。

### 新しいAGENTS.mdへ記録するルール

- 開発・インストール・起動・テスト・修正はCloud内で完結させ、ローカルPC操作を必須にしない。
- この引継ぎ書と仕様・進捗を読み、巨大化救出の企画を独立して進める。ホテル・投擲ゲームの仕様を持ち込まない。
- 実際のチェックアウトを使い、追加worktreeは依頼がない限り作らない。
- Node.js 24、TypeScript、Vite、Three.js、Rapier、Vitest、Playwrightを使用し、依存変更時はロックファイルも更新する。
- 物理・描画・ルール・UIを分離する。固定ステップ、実衝突、救出の成否、状態遷移、倍率制限、リセットをテストする。
- キーボード操作、フォーカス、描画非対応時の案内、画面揺れ軽減を維持する。
- 素材の出典・ライセンスを記録する。秘密情報と生成物をcommitしない。
- ユーザーの継続指示として、作業のまとまりごとに検証・commit・pushする。通常のpushごとに再確認しない。originがOne-Giant-Rescueであることを確認し、通常はmainへ送る。
- ユーザーの変更を保持し、force pushや共有履歴の書き換えをしない。
- 計画、実装済み、Cloudでの検証、実GPU性能、人による評価、GitHubへの保存、Cloud環境の公開、ゲームの一般公開を区別して報告する。

## 技術と確認済みの参照環境

| 項目         | 参照元で確認した値                      | 新環境での扱い                        |
| ------------ | --------------------------------------- | ------------------------------------- |
| OS           | Debian 13 / x86_64                      | イメージにより変わるため確認する      |
| Node / npm   | Node.js 24.19.0 / npm 11.9.0            | Node 24を使用し、packageManagerを固定 |
| 言語・ビルド | TypeScript 5.9.3 / Vite 8.3.4           | 参照元と同じ開始点が候補              |
| 3D・物理     | Three.js 0.186.1 / Rapier compat 0.21.0 | WebGL 2、WASM、固定ステップ1/60秒     |
| 単体・E2E    | Vitest 5.0.4 / Playwright 1.64.1        | 新ゲームの挙動を検証する              |
| ブラウザー   | Chromium 154、`/usr/bin/chromium`       | 存在・起動・WebGL描画を新環境で確認   |
| 配布形式     | Viteの `base: './'`、静的dist           | サブパスでも読み込めるようにする      |

依存の初回作成時は必要なバージョンを指定し、package-lock.jsonを生成・commitする。以降の再構築は `npm ci`。参照元の依存を使う場合も、新しいアプリ名とロックファイルを一致させる。

`.npmrc` は `cache=.cache/npm`、`save-exact=true`、`engine-strict=true` を基本にする。生成物・`.cache/`・`.env*` をGit管理から除外する。アプリ自体の実行にDB・バックエンド・APIキーは不要。

## Cloud環境を別に構築する手順

1. 新リポジトリが実在し、アクセスできることを確認する。ユーザーは新しいCodex Cloud環境に `TomofumiYabu/One-Giant-Rescue` のmainを選択する。利用可能なツールで独立環境の新規作成ができなければ、この選択操作はUI側で行う。
2. 新環境のセッションで `$cloud-environment-onboarding:setup` が利用できれば使用する。スキルが提供されない環境では本書の手順で進め、実際のチェックアウト、AGENTS.md、Node・npm・Chromium、既存認証とネットワークを確認する。
3. 本書に従って仕様・基盤・最小ゲームを実装する。空のリポジトリやREADMEだけの状態で `npm ci` が実行可能と扱わない。package.jsonとロックファイルを作成してからインストールする。
4. 実環境でビルド・物理テスト・ブラウザー操作・静的サブパス配信を実行する。成功・失敗・未検証を記録する。
5. 新セッションに結び付く環境設定ドラフトへinstall_scriptとstart_skillを保存する。設定ツールが提供されない場合は、検証した全文を `docs/DEVELOPMENT.md` に残して環境設定UIへ引き継ぐ。スクリプトを保存しただけで実行済みとしない。
6. 新環境の設定を確認・保存し、Cloud環境を公開して再利用できるようにする。新しいタスクでの復元確認は別に行う。ゲームの一般公開とは別の操作。

この引継ぎを作成したセッションの環境設定ツールは、そのセッションに結び付く設定を更新するもの。新企画のためにAstraの環境を上書きしない。

### install_scriptの候補

以下は参照元で使用した手順を新パスへ適用した候補。新リポジトリでは未実行。package.json・ロックファイルと `build` スクリプトを作成した後に実行・検証し、その全文を新環境の設定へ保存する。

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /workspace/One-Giant-Rescue

node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Use Node.js 24.");'
npm ci
npm run build

node --input-type=module <<'NODE'
import { accessSync, constants } from 'node:fs';
import { chromium } from '@playwright/test';
const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  chromium.executablePath(),
].filter(Boolean);
const browser = candidates.find(path => {
  try { accessSync(path, constants.X_OK); return true; } catch { return false; }
});
if (!browser) throw new Error('Chromium is required for Cloud browser tests.');
console.log('Chromium prerequisite verified.');
NODE
```

Chromiumがない場合は、イメージの対応する導入方法かPlaywrightのブラウザーを使用する。参照元のGitHub Actionsでは `npx playwright install --with-deps chromium` を使用した。新Cloud環境でのインストール権限・必要ドメイン・依存ライブラリを確認し、ダウンロードや証明書検証を無効化しない。

### start_skillへ保存する内容

- 作業場所 `/workspace/One-Giant-Rescue` と、この環境は既に隔離されているため追加のGit worktreeは依頼がない限り不要であること。
- AGENTS.md、docs/HANDOFF.md、SPEC.md、PROGRESS.mdを読み、依存がないかロックが変わった場合は `npm ci` を実行すること。
- `npm run dev` を長時間コマンドとして起動する。Viteを0.0.0.0:5173へバインドし、同じサービスを重複起動しない。停止は自分で起動したプロセスに限る。
- ループバックHTTPは内部検証用で、ユーザー向けの公開リンクとして提示しない。準備完了は `#app[data-state="planning"]`、描画済みcanvas、実際の巨大化と結果まで確認する。
- `npm run check` は型チェック・ビルド → 単体/物理 → E2E → 静的配信の順に行うよう構成する。E2E用4173、静的配信用4174は各テストが起動・停止するので空ける。
- サーバープロセス・ブラウザー・認証接続がスナップショットから復元される前提にしない。保持される依存やファイルと区別する。
- commit前に変更に応じた検証を行い、まとまりごとにcommit・pushする。送信先はOne-Giant-Rescueのoriginを確認する。Astraへ送らない。

## テストで確認すること

- 正常な大きさ・向きで救出が成立し、届かない配置では成立しない。
- 倍率の変更が見た目と衝突形状の両方へ反映され、接触で小物が動く。
- 一回の実行で二回目の巨大化が開始されず、リセットすると道具・猫・被害・状態が初期に戻る。
- 成長中に位置・回転・速度が非有限値にならず、剛体数が無制限に増えない。
- 固定物理ステップを使う。同じシミュレーション時間へ到達した時点で、異なる描画間隔でも同じゲーム判定になる。長いタブ停止は一度に過大なステップを実行しないよう上限を置く。
- Chromiumで本番バンドルのWebGL描画、方向/倍率の入力、実行、結果、再挑戦、エラー表示を検証する。テストが0件で終わった状態を合格と扱わない。
- 描画はSwiftShaderを使える。参照元では `--no-sandbox`、`--disable-dev-shm-usage`、`--use-angle=swiftshader`、`--enable-unsafe-swiftshader` と単一workerを使用した。これは実GPU性能の測定ではない。
- テスト用の低負荷画質を設け、物理ルールは通常画質と同じにする。参照元の低画質は影512px・描画バッファ幅最大800px。必要な値は新作で測る。
- 静的サーバーを `/One-Giant-Rescue/` だけで配信し、JS・CSS・favicon・ホームへの移動を確認する。参照元の `/Astra-3D-Game/` やホテルのアクセシブル名を残さない。

映像の理解しやすさと面白さは別途評価する。初見の人が「何を助けたいか」「何を巨大化したか」「次は何を変えるか」を説明できるかを見る。現段階では人による評価は実施していない。

## ネットワーク・GitHub・公開の注意点

依存取得にはパッケージマネージャーの許可設定、GitとGitHub APIには既存のプラットフォーム認証を使う。参照元のcustom許可先は `api.github.com`、`results-receiver.actions.githubusercontent.com`、`tomofumiyabu.github.io`。新環境では既存設定を読み、必要な接続先だけを追加する。プリセット許可先とcustom設定を混同しない。

資格情報は名前と存在だけを確認し、値をログ・文書・チャットへ出さない。Gitの読み取りが成功しても、新規作成・push・Pages設定は別々に確認する。

外部HTTPSをChromiumで検証する際はCloudのプロキシを正規に使う。参照元では標準実行が証明書エラーとなり、提供CAが既存NSS証明書DBで信頼されていることを照合したうえで、承認済みの実行権限を使うと公開サイトの操作に成功した。証明書エラーの無視、`ignoreHTTPSErrors`、ホーム変数の付け替えで回避しない。新環境の証明書・接続状況を再確認する。

新しいゲームの公開先は未設定。GitHub Pagesを選ぶ場合はアカウントとprivateリポジトリの利用条件を確認し、SourceをGitHub Actionsに設定する。リポジトリの公開範囲を無断変更しない。公開ワークフローは参照元を参考に、名前・配置パス・テストを新作へ合わせる。deploy成功と公開URLでの操作確認ができるまで公開済みと記録しない。

## 次セッションへの依頼文

新しいリポジトリとCloud環境を選択したセッションに、以下を渡せる。

> このリポジトリのdocs/HANDOFF.mdとAGENTS.mdを読んでください。『猫を降ろすだけ。—巨大化は一回だけ』を、Astra-3D-Gameとは独立したPCブラウザーゲームとして開発します。利用可能なら$cloud-environment-onboarding:setupを使い、ない場合は引継ぎ書の手順に従って、Cloud内だけで依存導入・実装・起動・自動テスト・修正まで進めてください。Node.js 24、TypeScript、Vite、Three.js、Rapierを使い、まず脚立一つで猫を救える一場面を作ってください。docsに仕様・技術構成・進捗・素材出典を残し、まとまりごとに検証してcommit・pushしてください。install_scriptとstart_skillはこの新環境の設定へ保存してください。設定ツールがなければ検証済み手順を文書に残してUIへ引き継いでください。実装、GitHubへの保存、Cloud環境の公開、ゲームの一般公開は状態を分けて報告してください。
