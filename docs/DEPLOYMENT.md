# 静的サイトの公開

## GitHub Pages（選択した公開先）

このゲームは `npm run build` の生成先 `dist/` だけで動く。実行時のNode.js、DB、APIキーは不要。

**公開URL: https://tomofumiyabu.github.io/Astra-3D-Game/**

最新版の公開記録: 2026-10-15 17:16 UTC、[ワークフロー38775237728](https://github.com/TomofumiYabu/Astra-3D-Game/actions/runs/38775237728) が `dbbd072` の19件のテスト・deployを完了。公開サイトの通常画質で16体撃破・13連鎖・26,990点、PNG保存、同じ結果のリプレイ、再挑戦、隊列変更を検証した。JavaScript／consoleエラー・通信失敗0。詳細は [進捗](PROGRESS.md)。

ホテル試作の初回公開記録: 2026-10-15（UTC）、[ワークフロー38751552143](https://github.com/TomofumiYabu/Astra-3D-Game/actions/runs/38751552143) でmainの `a73f1c5` のbuild・deployが成功。HTTP 200と、通常画質のChromiumによる起動・発射・得点表示・リトライを公開URLで確認した。

`.github/workflows/pages.yml` がmainへのpush時に、依存インストール → ビルド・物理・ブラウザー・静的配信テスト → Pagesへの配布を行う。公式Actionsは確認したコミットSHAに固定している。

初回設定は完了済み。設定先はGitHubリポジトリの **Settings → Pages → Build and deployment → Source: GitHub Actions**。

設定画面: https://github.com/TomofumiYabu/Astra-3D-Game/settings/pages

mainへのpushで更新される。手動で再公開する場合はActionsの **Deploy Throw Anything to GitHub Pages → Run workflow → main** で開始する。ドキュメントだけのcommitに `[skip ci]` を付けると、不要な再公開を省略できる。GitHub上の環境保護ルールやアカウントのPages利用条件がある場合は、それに従う。リポジトリの公開／非公開設定を勝手に変更しない。

Actions画面: https://github.com/TomofumiYabu/Astra-3D-Game/actions/workflows/pages.yml

更新時もdeployジョブの成功と公開URLのHTTP・ブラウザー検証で確認する。ファイルのpush成功だけを公開成功と扱わない。

## 配置パス

Viteの `base: './'` を使用。ホームリンクとfaviconも配置先を基準にするため、GitHub PagesのリポジトリパスとCloudflare Pages等のドメイン直下の両方で動く。

`npm run test:static` は、生成済みdistを `/Astra-3D-Game/` の下だけに配信する単純なHTTPサーバーで実際のChromiumを起動する。Viteのフォールバックを使用せず、JS・CSS・favicon・ホームリンク・WebGL起動を検証する。事前に `npm run build` が必要。

## Cloudflare Pagesを選ぶ場合

同じ静的ファイルで対応できる。Git連携でビルドコマンド `npm run build`、出力先 `dist`、Node.js 24を指定するか、distの内容をDirect Uploadする。Cloudflareアカウント・プロジェクトの設定は別途必要。この環境ではCloudflareへの認証や公開は行っていない。

## ChatGPT / Codexの環境公開との違い

このセッションで利用できる環境の「公開」は開発環境のスナップショットを保存する機能。ゲーム用の恒久的な一般公開URLを発行するホスティング機能は、現在利用できるツールにない。ゲームの一般公開先にはGitHub Pagesを使う。

## Cloudからの公開確認

Git接続、リポジトリ情報・Actions結果・Pages情報のAPI取得は成功。Pages未有効化時の権限制限は、所有者による初回設定で解消した。現在のAPIは `has_pages: true` を返し、公開URLはHTTP 200で応答する。

CloudのChromiumから外部HTTPSへ接続する場合は、提供されたプロキシと信頼済みCAを利用する。証明書エラーを無視しない。今回の確認ではユーザーのNSS証明書DBに既存の信頼済みCAを照合し、ブラウザー実行に承認済みの実行権限を使用した。再開手順は環境設定のstart_skillに保存している。

環境設定ドラフトには `api.github.com`、`tomofumiyabu.github.io`、Actionsログ配信先の `results-receiver.actions.githubusercontent.com` を追加した。ドラフト保存と実際のネットワーク適用を区別し、操作ごとに接続結果を確認する。
