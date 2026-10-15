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

Git接続、リポジトリ情報・Actions結果のAPI取得は成功。初期のネットワーク制限を解消した後、Pages APIのGETとPOSTは実際のGitHubから `403 Resource not accessible by integration` を返した。リポジトリの管理権限表示だけでは、連携アプリのPages権限があるとは限らない。

このため初回のPages有効化は、所有者が上記のGitHub設定画面で行う必要がある。連携アプリの権限を変更する方法もあるが、秘密情報をチャットへ貼り付ける必要はない。リポジトリ情報の `has_pages` はfalse、公開予定URLはHTTP 404を確認済み。

環境設定ドラフトには `api.github.com`、`tomofumiyabu.github.io`、Actionsログ配信先の `results-receiver.actions.githubusercontent.com` を追加した。ドラフト保存と実際のネットワーク適用を区別し、操作ごとに接続結果を確認する。
