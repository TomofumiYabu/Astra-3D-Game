# それ、投げるんですか？ — 本日の弾丸、おじさん。

スーツのおじさんを投げて、サイボーグ軍団を吹き飛ばす3D物理コメディ。敵同士の衝突をつなぎ、連鎖と飛距離を伸ばします。

**[ブラウザーで遊ぶ](https://tomofumiyabu.github.io/Astra-3D-Game/)** — PCブラウザー向け。公開反映の状態は [進捗](docs/PROGRESS.md) を参照してください。

## 操作

- `←` `→` / `A` `D` またはスライダーで狙う。
- `Space` または発射ボタンを長押しし、離して投げる。
- `R` または結果画面の「もう一投」で再挑戦。
- 3種類の隊列、結果画面からのリプレイ・結果画像の保存・お題URLのコピー。
- 音と画質は右上で切り替え。軽量描画のURLは `?quality=low`。

## Codex Cloudで開発

```sh
cd /workspace/Astra-3D-Game
npm ci
npm run dev
```

Node.js 24 / npm 11、TypeScript、Vite、Three.js、Rapierを使用します。APIキー・DB・外部アセットサービスは不要です。ローカルPCの準備を前提にしません。

```sh
npm run check
npm run format:check
```

型チェック・本番ビルド、ゲームルールと実物理のVitest、ChromiumでのPlaywright E2E、通常の静的HTTPサーバーによるサブパス配信を検証します。

## 構成

```text
src/game/stages.ts   隊列とお題の定義
src/game/rules.ts    操作・採点・結果の文言
src/game/physics.ts  固定ステップ・接触と連鎖・リプレイ記録
src/game/models.ts   キャラクターの手続き生成
src/game/scene.ts    会場・描画・カメラ・演出
src/game/audio.ts    合成効果音
src/game/result-card.ts 共有用PNGの生成・保存
src/main.ts         入力・UI・リプレイ・共有
src/style.css       レイアウトと表示状態
tests/              物理・操作・静的配信の検証
docs/               仕様・開発環境・進捗・企画・素材出典
```

詳細は [仕様](docs/SPEC.md)、[技術構成](docs/ARCHITECTURE.md)、[開発環境](docs/DEVELOPMENT.md)、[進捗](docs/PROGRESS.md)、[改善方針](docs/THROWING_GAME_DIRECTION.md) を参照してください。巨大化で猫を救う別企画の [引継ぎ書](docs/ONE_GIANT_RESCUE_HANDOFF.md) も保存しています。

## 静的サイト公開

`dist/` だけで動作します。mainへのpushでGitHub Actionsが検証し、GitHub Pagesへ公開します。[公開手順](docs/DEPLOYMENT.md) を参照してください。
