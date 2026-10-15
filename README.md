# ホテル・アストラ — お荷物、飛ばします。

高級ホテルのベル係になり、巨大なスーツケースを発射する3D物理コメディ。PCブラウザー向けの最初のプロトタイプです。

## Codex Cloudで開発

```sh
cd /workspace/Astra-3D-Game
npm ci
npm run dev
```

Node.js 24 / npm 11を使用します。追加のAPIキー・DB・外部アセットサービスは不要です。Cloudの検証は内部HTTPアクセスとChromiumで行い、ローカルPCの準備を前提にしません。

```sh
npm run check
```

型チェックと本番ビルド、Vitestによるゲームルール・物理テスト、Playwrightによる本番バンドルの操作テストを実行します。CloudにはChromiumが入っています。別のCloudイメージでは `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で実行ファイルを指定するか、PlaywrightのChromiumをインストールしてください。

## 操作

- `←` `→` / `A` `D` または角度スライダーで狙う。
- `Space` または発射ボタンを長押しし、離して飛ばす。
- 結果画面の「もう一度」で再挑戦。`R` でもリトライ。
- 音は右上のボタンで切り替え。低負荷描画はURLのクエリー `?quality=low`。

## 構成

```text
src/game/        ゲームルール・Rapier物理・Three.jsシーン
src/main.ts      UIと入力
src/style.css    画面レイアウト
tests/unit/      ルール・物理テスト
tests/e2e/       Chromiumでの実操作テスト
docs/           仕様・技術選定・Cloud手順・進捗・素材出典
```

詳細は [仕様](docs/SPEC.md)、[技術構成](docs/ARCHITECTURE.md)、[開発環境](docs/DEVELOPMENT.md)、[進捗と残課題](docs/PROGRESS.md) を参照してください。

## 静的サイト公開

`dist/` をGitHub Pagesなどの静的ホスティングで配信できます。mainへのpushでビルド・テスト・公開するGitHub Actionsを用意しています。GitHub Pagesの初回設定と現在の公開状況の確認方法は [公開手順](docs/DEPLOYMENT.md) を参照してください。
