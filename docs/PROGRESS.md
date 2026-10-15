# 進捗と残課題

最終更新: 2026-10-16（日本時間）。[GitHub Pagesで公開済み](https://tomofumiyabu.github.io/Astra-3D-Game/)。CloudとGitHub Actionsで14件のテストが成功し、実際の公開URLでも通常画質の1ラウンドとリトライを確認。

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
- [x] GitHub Pagesへの初回公開と公開URLでのゲーム操作を検証。

## 検証記録

- 依存インストール: 成功。保存するinstall_scriptを実行し、`npm ci` で再インストールしてもpackage-lock.jsonのSHA-256が変わらないことを確認。
- 型チェック／本番ビルド: 成功。生成JSは約4.89MB（gzip約1.81MB）。WASMを同梱するためViteの500KB警告あり。読み込みサイズの最適化は残課題。
- ユニット／物理テスト: **10件成功、失敗0、スキップ0**。チャージ・得点・標的の安定性・実衝突・リセット・2/30/60fps間の物理再現性・長い停止の上限を検証。
- Chromium E2E: **3件成功、失敗0、スキップ0**。実描画、角度調整、フルチャージ、衝突、結果、再挑戦、ポインター入力、キャンセル、音の切替、WebGL非対応時の案内を検証。
- 静的配信テスト: **1件成功、失敗0、スキップ0**。Viteを使わないHTTPサーバーの `/Astra-3D-Game/` 配下で、JS・CSS・favicon・ホームへの再移動・WebGL起動を検証。変更後の `npm run check` は合計14件成功。
- 最終E2Eの実ラウンド: 標的10/10、損害額576,000円。通常の成功ルートにJavaScript／consoleエラーなし。
- 公開URLの検証: HTTP 200、通常画質のChromiumでWebGL描画 → Space長押し・発射 → 標的10/10・損害額576,000円 → リトライ・得点リセットを確認。JavaScript／consoleエラー・リクエスト失敗なし。Cloudの提供CAがChromiumのNSSで信頼済みであることを照合し、TLS検証を維持して実行。
- 画面目視: 通常画質の1440×900と700×1000、低負荷画質のロビー・結果画面を確認。手前の壁による遮蔽をカメラ位置で修正。通常画質の起動時JavaScriptエラーなし。
- 書式: `npm run format:check` 成功。
- 環境の再利用設定: **install_script / start_skillをドラフト保存済み**。現在の環境でインストール・起動手順を実行済み。ドラフト保存は公開や新タスクの復元確認とは別。

## 保存と起動の状態

- 初回実装とcommit・pushルールを `2f22d44` としてorigin/mainへpush済み。リモートの同一SHAを確認。
- GitHub Pages向け設定を `6e77748` としてmainへpush済み。mainへのpushでテスト後に公開する。
- 初回GitHub Actionsではビルド・単体テストが成功したが、ソフトウェア描画の低fpsで結果画面のテストがタイムアウト。低画質の描画幅を最大800pxにし、物理の固定ステップを1フレーム最大0.5秒分まで進める修正を `d69dbee` としてpush。Cloudの14件とGitHub Actionsの14件が成功。
- [公開に成功したGitHub Actions](https://github.com/TomofumiYabu/Astra-3D-Game/actions/runs/38751552143): 所有者によるPages設定後、mainの `a73f1c5` を手動実行。build・deployとも成功し、実サイトのJS・CSSが検証済みビルドと一致することを確認。
- GitHub API・Actions・Pages情報の読み取りは接続確認済み。現在は `has_pages: true`、公開先は `https://tomofumiyabu.github.io/Astra-3D-Game/`。初回有効化待ちの障害は解消。
- 必要なAPI・公開サイト・Actionsログの接続先を環境設定ドラフトに追加済み。
- 開発サーバーは `npm run dev` で起動できる。スナップショット復元後は再起動する。
- 環境を継続利用するには、環境設定で保存済みドラフトを確認・保存し、環境を公開する。新しいCloudタスクでの復元は別途確認が必要。
- スクリーンショットは `artifacts/` と `test-results/` にある生成物。公開サイトの確認結果は `artifacts/published-verification.json`、画面は `artifacts/published-lobby.png` と `artifacts/published-result.png`。Git管理対象には含めない。

## 次の段階

最初の比較は [企画再検討](CONCEPT_REVIEW.md) に記録。3人のサブエージェントが別方向の企画を検討し、主担当は現行物理の45入力を比較した。外部の公式資料は接続制限で取得できず、人気・売上・SNS実績は未確認。人による企画評価も未実施。

その後のユーザー指示に基づき、ホテル・荷物に限定せず、ありえない物を投げる爽快感とシュールさを中心に [改善方針](THROWING_GAME_DIRECTION.md) を更新。おじさん×サイボーグ、戦車×怪獣、ケーキの空輸などを、共通の投擲操作を持つステージとして提案した。次の試作候補はおじさん×サイボーグ。新ステージ・演出の実装はまだ行っていない。

巨大化で猫を救う案は独立企画の [引継ぎ書](ONE_GIANT_RESCUE_HANDOFF.md) を作成。新しいprivateリポジトリ `TomofumiYabu/One-Giant-Rescue` の作成を試みたが、GitHub連携のGraphQL・RESTとも `Resource not accessible by integration` で拒否された。ユーザーの最終指定により、今回は引継ぎ書の保存までで完了とする。文書には次セッション用の企画・最小スコープ・AGENTSルール・依存・Cloud設定・テスト・開始用依頼文を含めた。新リポジトリの作成、独立したCloud環境の登録・公開は未実施。

1. 遊びの評価: 衝突の気持ちよさ、初見の分かりやすさ、失敗時の面白さ。
2. 演出: 衝突時スローモーション、カメラ切替、リプレイ、飛び散る小物。
3. アート: 参考映像と予算を決め、専用モデル・PBRテクスチャ・HDRI・人物とアニメーションを導入。
4. 配信向け: 1クリック再挑戦、画面キャプチャ／短いリプレイ出力、ランダムお題。
5. 公開後の改善: バンドルサイズ、実GPU性能、他ブラウザー、音量、アクセシビリティ。

## 未検証・非対応

- 実GPUのfps、AAA相当の映像品質、SNS拡散効果。
- Firefox / Safari、スマートフォン最適化、ゲームパッド、配信ソフトとの連携。
- 別Cloudタスクでのスナップショット復元。

## 今後の更新

実装の変更は検証後にcommit・mainへpushすると自動公開される。deploy成功後は公開URLでも確認する。ドキュメントだけの変更で `[skip ci]` を付けたcommitは再公開しない。Cloud環境設定のドラフト保存・環境公開はゲームの公開とは独立している。

アプリは最初のプロトタイプ。上記の未完了項目を完成済みと扱わない。
