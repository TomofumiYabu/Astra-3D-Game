# Cloud開発・再開手順

作業場所: `/workspace/Astra-3D-Game`。Cloudタスクは既に隔離されているため、追加のGit worktreeは不要。

## 環境

- Debian 13 / x86_64、Node.js 24.19.0、npm 11.9.0。
- Chromium 154（`/usr/bin/chromium`）。Playwrightはこの実行ファイルを自動検出する。
- npmパッケージ取得先は `registry.npmjs.org`。Git操作は既存のGitHub HTTPSプロキシを使用する。
- アプリ実行時の外部通信・APIキー・DB・追加の環境変数は不要。
- npmキャッシュは `.npmrc` の `.cache/npm`。ホームディレクトリへの書き込みに依存しない。

## インストール

```sh
cd /workspace/Astra-3D-Game
npm ci
```

依存を追加した場合だけ `npm install <package>` でロックファイルを更新する。TLS・署名・チェックサム検証を無効にしない。

## 起動

```sh
cd /workspace/Astra-3D-Game
npm run dev
```

開発サーバーは5173ポート、全インターフェースにバインド。環境の公開・復元でプロセスは保存されないため、必要なタスクで再起動する。内部HTTPリクエストはサーバー確認に使えるが、ゲームの準備完了はブラウザーで `#app[data-state="ready"]` と実描画を確認する。

## 検証

```sh
cd /workspace/Astra-3D-Game
npm run check
```

順番に型チェック＋本番ビルド、ユニット／物理テスト、E2E、静的配信テストを実行。E2Eは自身で4173ポートのpreviewを起動・停止し、静的配信テストは4174ポートを使用する。これらのポートのサーバーを先に起動しない。

個別には `npm run build`、`npm test`、`npm run test:e2e`。E2E前に最新のビルドが必要。Chromiumのパスが異なるCloudイメージでは `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` を指定できる。代替としてPlaywright管理のChromiumを導入できるが、この環境では追加ダウンロード不要。

`npm run test:static` はGitHub Pagesと同じリポジトリパスで、通常の静的HTTP配信でも動作することを検証する。公開の詳細は [DEPLOYMENT.md](DEPLOYMENT.md) を参照する。

書式は `npm run format` で整え、`npm run format:check` で確認する。書式確認はゲームの動作検証を代替しない。

`test-results/` に今回のスクリーンショット・失敗時トレース、`playwright-report/` にHTMLレポートを出力。これらと `dist/`、`node_modules/` は生成物でGit管理対象外。

テストはCloud内のループバックHTTPを使う。ユーザー向けの公開リンクとは異なる。公開用ホスティングは今後の独立した作業。

## 復元と公開

インストール済み依存と生成ファイルはスナップショット対象。サーバープロセスや開いていたページの復元は前提にしない。環境設定のinstall_scriptとstart_skillは再構築・再開用の手順であり、保存しただけでは実行・公開されない。
