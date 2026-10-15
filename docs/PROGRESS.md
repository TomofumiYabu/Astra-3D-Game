# 進捗と残課題

最終更新: 2026-10-15（日本時間）。実装・公開設定・低速描画の修正をGitHubへpush済み。CloudとGitHub Actionsで14件のテストが成功。Pages初回有効化の権限が残る障害。

## 完了した実装

- [x] PCブラウザー向けのホテル物理コメディに方針決定。
- [x] TypeScript / Vite / Three.js / Rapierの構成と開発ルール。
- [x] AGENTS.md・仕様・技術選定・Cloud開発手順・素材一覧。
- [x] プロシージャルなホテルロビー、陰影と暖色照明、荷物モデル。
- [x] 狙い・チャージ・発射・物理衝突・損害額・結果・リトライ。
- [x] キーボード／マウス、簡易音、最高額保存、WebGL失敗案内。
- [x] 単体・物理・本番バンドルのE2Eテストを作成。
- [x] 適切な粒度でcommit・pushする継続ルールをAGENTS.mdに追加。
- [x] 相対アセットパス、GitHub Pagesの自動公開ワークフロー、公開手順を作成。

## 検証記録

- 依存インストール: 成功。保存するinstall_scriptを実行し、`npm ci` で再インストールしてもpackage-lock.jsonのSHA-256が変わらないことを確認。
- 型チェック／本番ビルド: 成功。生成JSは約4.89MB（gzip約1.81MB）。WASMを同梱するためViteの500KB警告あり。読み込みサイズの最適化は残課題。
- ユニット／物理テスト: **10件成功、失敗0、スキップ0**。チャージ・得点・標的の安定性・実衝突・リセット・2/30/60fps間の物理再現性・長い停止の上限を検証。
- Chromium E2E: **3件成功、失敗0、スキップ0**。実描画、角度調整、フルチャージ、衝突、結果、再挑戦、ポインター入力、キャンセル、音の切替、WebGL非対応時の案内を検証。
- 静的配信テスト: **1件成功、失敗0、スキップ0**。Viteを使わないHTTPサーバーの `/Astra-3D-Game/` 配下で、JS・CSS・favicon・ホームへの再移動・WebGL起動を検証。変更後の `npm run check` は合計14件成功。
- 最終E2Eの実ラウンド: 標的10/10、損害額576,000円。通常の成功ルートにJavaScript／consoleエラーなし。
- 画面目視: 通常画質の1440×900と700×1000、低負荷画質のロビー・結果画面を確認。手前の壁による遮蔽をカメラ位置で修正。通常画質の起動時JavaScriptエラーなし。
- 書式: `npm run format:check` 成功。
- 環境の再利用設定: **install_script / start_skillをドラフト保存済み**。現在の環境でインストール・起動手順を実行済み。ドラフト保存は公開や新タスクの復元確認とは別。

## 保存と起動の状態

- 初回実装とcommit・pushルールを `2f22d44` としてorigin/mainへpush済み。リモートの同一SHAを確認。
- GitHub Pages向け設定を `6e77748` としてmainへpush済み。mainへのpushでテスト後に公開する。
- 初回GitHub Actionsではビルド・単体テストが成功したが、ソフトウェア描画の低fpsで結果画面のテストがタイムアウト。低画質の描画幅を最大800pxにし、物理の固定ステップを1フレーム最大0.5秒分まで進める修正を `d69dbee` としてpush。Cloudの14件とGitHub Actionsの14件が成功。
- [GitHub Actionsの検証結果](https://github.com/TomofumiYabu/Astra-3D-Game/actions/runs/38750385754): buildジョブ成功、公開用artifactアップロード成功。deployジョブはPages未有効化のためconfigure-pagesで404。ゲームのビルド／テスト失敗とは区別する。
- GitHub API・Actionsの読み取りは接続確認済み。ただしPages APIのGET／POSTは `403 Resource not accessible by integration`。初回有効化には所有者によるGitHub設定画面の操作が必要。公開予定URLのHTTP 404、`has_pages: false` を確認。
- 必要なAPI・公開サイト・Actionsログの接続先を環境設定ドラフトに追加済み。
- 開発サーバーは `npm run dev` で起動できる。スナップショット復元後は再起動する。
- 環境を継続利用するには、環境設定で保存済みドラフトを確認・保存し、環境を公開する。新しいCloudタスクでの復元は別途確認が必要。
- スクリーンショットは `artifacts/` と `test-results/` にある生成物。Git管理対象には含めない。

## 次の段階

1. 遊びの評価: 衝突の気持ちよさ、初見の分かりやすさ、失敗時の面白さ。
2. 演出: 衝突時スローモーション、カメラ切替、リプレイ、飛び散る小物。
3. アート: 参考映像と予算を決め、専用モデル・PBRテクスチャ・HDRI・人物とアニメーションを導入。
4. 配信向け: 1クリック再挑戦、画面キャプチャ／短いリプレイ出力、ランダムお題。
5. 配布前: バンドルサイズ、実GPU性能、他ブラウザー、音量、アクセシビリティ、公開先の確認。

## 未検証・非対応

- 実GPUのfps、AAA相当の映像品質、SNS拡散効果。
- Firefox / Safari、スマートフォン最適化、ゲームパッド、配信ソフトとの連携。
- 外部への公開成功、別Cloudタスクでのスナップショット復元。

## 公開のために残る操作

1. リポジトリ所有者が [Settings → Pages](https://github.com/TomofumiYabu/Astra-3D-Game/settings/pages) でSourceをGitHub Actionsに設定する。
2. [公開ワークフロー](https://github.com/TomofumiYabu/Astra-3D-Game/actions/workflows/pages.yml) をmainでRun workflowする（設定後にCodexへ続行を依頼してもよい）。
3. deploy成功後に実際の公開URLをHTTP・ブラウザーで確認する。それまでは公開済みと扱わない。

アプリは最初のプロトタイプ。上記の未完了項目を完成済みと扱わない。
