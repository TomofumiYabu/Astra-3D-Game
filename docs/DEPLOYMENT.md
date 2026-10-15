# 静的サイトの公開

## GitHub Pages（選択した公開先）

このゲームは `npm run build` の生成先 `dist/` だけで動く。実行時のNode.js、DB、APIキーは不要。

`.github/workflows/pages.yml` がmainへのpush時に、依存インストール → ビルド・物理・ブラウザー・静的配信テスト → Pagesへの配布を行う。公式Actionsは確認したコミットSHAに固定している。

初回にGitHubリポジトリの **Settings → Pages → Build and deployment → Source: GitHub Actions** を選ぶ。

設定画面: https://github.com/TomofumiYabu/Astra-3D-Game/settings/pages

その後、Actionsの **Deploy Hotel Astra to GitHub Pages → Run workflow → main** で開始する。以降はmainへのpushで更新される。GitHub上の環境保護ルールやアカウントのPages利用条件がある場合は、それに従う。リポジトリの公開／非公開設定を勝手に変更しない。

Actions画面: https://github.com/TomofumiYabu/Astra-3D-Game/actions/workflows/pages.yml

標準ドメインの場合の公開予定URL: `https://tomofumiyabu.github.io/Astra-3D-Game/`。実際の公開完了とURLは、deployジョブの出力およびそのURLのHTTP・ブラウザー検証で確認する。ファイルのpush成功だけを公開成功と扱わない。

## 配置パス

Viteの `base: './'` を使用。ホームリンクとfaviconも配置先を基準にするため、GitHub PagesのリポジトリパスとCloudflare Pages等のドメイン直下の両方で動く。

`npm run test:static` は、生成済みdistを `/Astra-3D-Game/` の下だけに配信する単純なHTTPサーバーで実際のChromiumを起動する。Viteのフォールバックを使用せず、JS・CSS・favicon・ホームリンク・WebGL起動を検証する。事前に `npm run build` が必要。

## Cloudflare Pagesを選ぶ場合

同じ静的ファイルで対応できる。Git連携でビルドコマンド `npm run build`、出力先 `dist`、Node.js 24を指定するか、distの内容をDirect Uploadする。Cloudflareアカウント・プロジェクトの設定は別途必要。この環境ではCloudflareへの認証や公開は行っていない。

## ChatGPT / Codexの環境公開との違い

このセッションで利用できる環境の「公開」は開発環境のスナップショットを保存する機能。ゲーム用の恒久的な一般公開URLを発行するホスティング機能は、現在利用できるツールにない。ゲームの一般公開先にはGitHub Pagesを使う。

## 現在の制限

CloudからのGit接続は動作するが、GitHub APIはプロキシのCONNECT段階で403となる。これはGitHub APIが返した権限エラーとは区別する。公開設定の自動変更やActions結果のAPI取得は未検証。

環境設定ドラフトには `api.github.com` と `tomofumiyabu.github.io` の許可を追加した。ドラフトの保存だけでは現在のネットワークに適用されない。適用後にAPIの既存認証を再確認し、利用できれば設定と公開検証をCloudから続行する。秘密情報をチャットへ貼り付ける必要はない。
