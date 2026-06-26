# 3AI Research & Report

3AI（ChatGPT / Claude / Gemini）の回答を比較し、ユーザーが採用した重要文から最終レポートを組み立てる AI リサーチ作業台。

- **GitHub:** https://github.com/hiroshiandailab/3ai-research-and-report
- **Surge（モック版）:** https://hiroshi-tsutsumi-202506-3ai-research-and-report.surge.sh/
- **元プロジェクト:** `research-workbench` のコピー＋ブランディング差分

## 開発環境の引き継ぎ（Cursor ↔ Codex）

```text
Cursor（GitHub push）
     ↓
git clone でローカルに取得
     ↓
Codex → /init で AGENTS.md 生成（初回のみ。以降は本ファイルを更新）
     ↓
AGENTS.md に作業状況を追記
     ↓
Codex で開発継続
```

**初回セットアップ（Codex 側）**

```powershell
git clone https://github.com/hiroshiandailab/3ai-research-and-report.git
cd 3ai-research-and-report
npm install
npm run dev
# → http://localhost:3000
```

セッション開始時は **本ファイルの「作業状況」** と **`HANDOFF.md`** を読んでから着手すること。

---

## 絶対守ること

- **既存 Surge URL へデプロイしない:** https://hiroshi-tsutsumi-202605-workspace.surge.sh/（`research-workbench` 用）
- Surge版はモックとして凍結し、**今後は再デプロイしない**
- 本番公開先は第7段階で作成するVercelプロジェクト
- **3AI接続コード実装済み** — APIキー設定とライブ通信確認は要対応
- 変更は **最小スコープ** — 依頼外のリファクタ・UI 全面変更・依存追加はしない
- PowerShell では `&&` 不可 → `;` を使う

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| Framework | Next.js 15.5（App Router / Server） |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 実行 | Vercel向けサーバーレンダリング + Route Handlers |
| 状態 | React state + localStorage（`research-storage.ts`） |
| 認証 | Auth.js + Google OAuth + 許可メール |
| Node | `npm install` 後 `npm run dev` / `npm run build` |

---

## コマンド

```powershell
npm run dev      # 開発サーバー http://localhost:3000
npm run build    # サーバー版の本番ビルド
npm run lint     # ESLint
npm run start    # 本番ビルドをローカル起動
```

---

## ディレクトリ構成

```text
src/
  app/
    layout.tsx              # metadata: 3AI Research & Report
    page.tsx                # ResearchWorkbench を表示
    globals.css             # テーマ変数（青グレー研究ノート風）
  components/
    research-workbench.tsx  # メイン UI（3ステップ・ヘッダー）★最重要
    ai-reports-modal.tsx    # 3AI モーダル（タブ: ChatGPT/Gemini/Claude/Compare）
    research-card-item.tsx  # カード（compact 対応）
    ui/                     # shadcn 部品
  hooks/
    use-research-workbench.ts  # 状態・ダミー Research・採用・反映
  lib/
    ai/                     # OpenAI / Claude / Gemini本番アダプター
    research-brief.ts       # Art プレースホルダー等
    research-mock-ai.ts     # 検証案テンプレート
    research-markdown.ts    # Markdown 出力
    research-storage.ts     # localStorage
  types/
    research.ts             # WorkspaceState, WORKFLOW_STEPS, BOARD_PANELS
```

**編集頻度が高いファイル:** `research-workbench.tsx`, `use-research-workbench.ts`, `ai-reports-modal.tsx`

---

## 画面構成（3ステップ）

### STEP 1 — AIレポートを見る

- **リサーチ対象:** `[Art]` `[Academic]` `[Business]` — 初期選択 **Art**
- **Main Question** — Art 時プレースホルダー:
  `この情報は、ひろしのAIクリエイター活動・Genmapping・作品制作にどう役立つか？`
- ボタン（縦並び・右列）:
  - `[Research]` — 青 `#2563EB`
  - `[3AIレポートを開く]` — 黒 `#0F172A` / 白文字
- Markdown 生成は **STEP 3 のみ**

### STEP 2 — 重要文を採用する

- レイアウト: `9fr 3fr`（PC）/ モバイル縦並び
- 左: **AI共通まとめ**（75%）— カード選択可
- 右: **採用する重要文**（25%）— Textarea で手入力追記可
- 右下: **`[選択文を採用する]`** — 青

### STEP 3 — 最終レポートを作る

- 最終レポート本文（Textarea）
- 右下ボタン（この順）:
  1. **`[最終本文を作成]`** — 採用 B 層文を本文へ反映
  2. **`[Markdown生成]`** — コピー + ダウンロード（緑 `#0F766E`）

### 3AIレポートモーダル

- タブ: ChatGPT / Gemini / Claude / Compare
- **`[共通点をAI共通まとめへ反映]`** + `[閉じる]`

---

## データモデル（内部）

| 層 | UI 表示名 | 用途 |
|----|-----------|------|
| A | AI共通まとめ | 3AI 共通点・整理メモ |
| B | 採用する重要文 | ユーザーが残す文 |
| C | （内部） | 最終レポート・検証案関連 |

- `mode`: `ART` | `ACADEMIC` | `BUSINESS`（デフォルト **ART**）
- `lockProfile`: `FULL` | `LITE`（UI から削除済み、state は残存）

---

## デザイン方針

- 白基調 + 薄い青グレー（研究ノート風）— **黒背景 UI に戻さない**
- 背景 `#F5F8FB` / カード白 / ボーダー `#D8E2EC` / 本文 `#0F172A` / 補助 `#64748B`
- 既存コンポーネント・Tailwind クラスの命名に合わせる

---

## コード生成ルール

- JSX で `<motion>` 等の誤タグを書かない（`<div>` を使う）
- shadcn 部品が使える箇所で自前 div に置き換えない
- 日本語 UI 文言はユーザー指定がある場合のみ変更
- ビルド確認: `npm run build`（静的 export エラーに注意）
- `.env*` はコミットしない

---

## 関連プロジェクト（混同注意）

| 名称 | ローカル | Surge | GitHub |
|------|----------|-------|--------|
| **本リポジトリ** | `3ai-research-and-report` | 202506-3ai（新） | hiroshiandailab/3ai-research-and-report |
| Research Workbench（既存） | `research-workbench` | 202605-workspace（**触らない**） | 別管理 |
| 月次レポート（図解） | `personal-workspace-report` | 202605-personal-workspace | 静的 HTML のみ |

---

## 作業状況

**最終更新:** 2026-06-27
**担当:** Codex

### 完了済み

- [x] 3ステップ UI（STEP1 入力 → STEP2 採用 → STEP3 最終レポート）
- [x] リサーチ対象 Art / Academic / Business（Art デフォルト）
- [x] 3AI モーダル（ダミー）・Compare → AI共通まとめ反映
- [x] STEP2 9:3 グリッド・採用 Textarea・「選択文を採用する」
- [x] STEP3「最終本文を作成」+「Markdown生成」
- [x] ライトテーマ（研究ノート風）・静的 export・Surge deploy スクリプト
- [x] GitHub リポジトリ作成・初回 push（`main`）
- [x] `HANDOFF.md` 引き継ぎメモ
- [x] **本ファイル `AGENTS.md` 作成**（Codex 用）
- [x] モック構成の整理・把握（`research-mock-ai.ts` / `use-research-workbench.ts` / `types/research.ts`）
- [x] **第4回グループセッション 図解ページ作成・Surge デプロイ**
  - URL: https://hiroshi-tsutsumi-202606-3aireport-databese.surge.sh/
  - ローカル: `C:\Users\h\src\3aireport-database-site\index.html`（独立した静的 HTML）
  - 内容: 製品名変更・3STEP概要・保存先フロー・保存理由・ファイル形式まとめ
- [x] 本番 Surge URL を有効なホスト名へ修正
  - 旧: `hiroshi-tsutsumi-202506-3ai_research_and_report.surge.sh`（アンダースコアを含むため使用不可）
  - 新: `hiroshi-tsutsumi-202506-3ai-research-and-report.surge.sh`
- [x] 新 Surge URL へ最新ビルドをデプロイし、PC・スマートフォン表示を確認
- [x] STEP 2 と STEP 3 の重なりを解消し、ページ全体を縦スクロール表示へ修正
- [x] **第1段階: Next.jsサーバー化・認証**
  - `output: "export"` を解除し、Vercel向けサーバー構成へ変更
  - Auth.js + Google OAuthを追加
  - `AUTH_ALLOWED_EMAILS` による許可ユーザー制限
  - 未認証時は `/login` へ移動
  - ログアウト操作をヘッダーへ追加
  - Next.jsを脆弱性修正版 `15.5.19` へ更新
  - 既存Surge版はモックとして凍結
- [x] **第2段階: OpenAI → Claude → Gemini接続**
  - OpenAI Responses API + Web Search
  - Claude Messages API + Web Search Tool
  - Gemini API + Google Search grounding
  - `/api/research` を認証必須Route Handlerとして追加
  - 3社を並列実行し、部分失敗時も成功レポートを保持
  - モックへの自動フォールバックを廃止
  - APIキー・モデル名をサーバー環境変数化
- [x] **APIキー漏えい防止**
  - `.env.local`をGit管理外に維持
  - AI接続モジュールを`server-only`化
  - `NEXT_PUBLIC_*_API_KEY`を禁止
  - API応答を`private, no-store`化
  - 外部向けエラーからSDK詳細を除去
  - `npm run check:secrets`を追加
  - 設定手順: `docs/API_KEY_SETUP.md`
- [x] **ローカル認証・実API通信確認**
  - Google OAuth Webクライアントを設定し、許可アカウントでログイン成功
  - `.env.local` の認証情報・3社APIキーを秘密情報検査済み
  - OpenAI / Claudeは実通信とWeb検索を確認
  - Gemini APIキーは有効。生成は利用枠超過（429）のため保留
  - 3社をアプリ経由で実行し、成功・失敗の個別表示を確認
  - 各AI通信を90秒で打ち切り、SDKの自動再試行を抑制
- [x] **Gemini利用枠再確認（2026-06-27）**
  - `npm run test:ai` でOpenAI / Claudeは成功
  - GeminiはAPIキー有効、生成は引き続き利用枠超過（`KEY_OK_QUOTA_BLOCKED`）
- [x] **Google Drive保存（GAS連携）実装**
  - `/api/save/google-drive` を認証必須Route Handlerとして追加
  - `[最終本文を作成]` 後にGoogle Drive保存を実行
  - GASコード: `gas/google-drive-save/Code.gs`
  - 手順書: `docs/GOOGLE_DRIVE_GAS_SETUP.md`
  - 保存テストコマンド: `npm run test:drive`
  - `GOOGLE_DRIVE_GAS_WEB_APP_URL` / `GOOGLE_DRIVE_GAS_SHARED_SECRET` はサーバー環境変数のみ
  - 2026-06-27: `npm run test:drive` 成功。Google Driveへ `.docx` 作成確認済み
- [x] **第3段階: 3AI比較・出典統合**
  - `src/lib/ai/comparison.ts` を追加
  - 3AI回答からMarkdownリンク形式の出典URLを抽出・統合
  - 成功したAI回答から「共通点」「相違点」「採用候補」「統合出典」「注意点」をCompareへ生成
  - Gemini失敗時もOpenAI / Claudeなど成功分で比較を作成
  - 「共通点をAI共通まとめへ反映」はCompareの採用候補・共通点をカード化し、出典URLも保持
- [x] **第5段階: GitHub Markdown保存 実装**
  - `/api/save/github-markdown` を認証必須Route Handlerとして追加
  - `[Markdown生成]` 後にGitHub REST APIへ `.md` を保存
  - 保存先初期値: `hiroshiandailab/3ai-research-and-report` の `reports/YYYY-MM-DD/`
  - PATは `GITHUB_REPORT_TOKEN` としてサーバー環境変数のみで保持
  - 手順書: `docs/GITHUB_MARKDOWN_SETUP.md`
  - 保存テストコマンド: `npm run test:github`
  - `check:secrets` にGitHub PAT検出を追加
  - 2026-06-27: 実GitHub保存成功。日本時間の `reports/2026-06-27/` に `.md` 作成確認済み
- [x] **第1〜第5段階 再監査（2026-06-27）**
  - 認証・3AI接続・比較統合・Drive実保存・GitHub実保存のコードと記録を再確認
  - 第1〜第5段階は実装完了。Gemini生成のみ外部利用枠超過の継続課題
- [x] **第6段階: エラー処理・料金制御・テスト**
  - AIエラーを設定不備・利用枠・タイムアウト・認証・サービス停止へ分類
  - APIキー・GitHub PATをサーバーログで伏字化
  - 3AIの最大出力量を各4000トークンに統一
  - 許可ユーザーごとにResearchを既定1時間6回・30秒間隔へ制限
  - Google Drive / GitHub保存のタイムアウト・利用枠エラーを分離
  - `npm run test:unit` を追加（5件成功）
  - `npm run verify` に秘密情報検査・lint・単体テスト・本番ビルドを統合
  - 手順書: `docs/ERROR_COST_TESTING.md`

### 未着手 / 要確認

- [ ] VercelへGoogle OAuth・3社APIの環境変数を設定
- [ ] Geminiの課金・利用枠を有効化し、生成成功を再確認
- [x] **Google Drive保存の実Driveテスト**
  - `hiroshiandailab@gmail.com` 側でGAS Webアプリを作成・デプロイ済み
  - `.env.local` に `GOOGLE_DRIVE_GAS_WEB_APP_URL` / `GOOGLE_DRIVE_GAS_SHARED_SECRET` を設定済み
  - `npm run test:drive` で `.docx` 作成を確認済み
- [x] **GitHub Markdown保存の実GitHubテスト**
  - `.env.local` に `GITHUB_REPORT_TOKEN` を設定済み
  - `npm run test:github` で `.md` 作成を確認済み
  - 保存フォルダの日付を日本時間（`Asia/Tokyo`）へ統一済み
- [ ] Vercelでは `GITHUB_REPORT_TOKEN` をSensitive環境変数に設定
- [ ] Vercelへ第6段階の料金制御環境変数を設定
- [x] 本番 API（OpenAI / Gemini / Claude）接続コード
- [ ] `research-workbench` との同期方針（凍結 vs マージ）
- [ ] GitHub Pages / Vercel 等の検討（現状 Surge 前提）

### 直近の作業メモ（Cursor 側）

- 月次課題レポート（`personal-workspace-report`）は別 Surge URL。アプリ本体とは独立
- レポート用キャプチャは `C:\Users\h\Desktop\My-First-Project\images\Research Workbench.png`
- `gh` CLI の winget インストールは失敗履歴あり。repo 作成は git credential + API で実施済み
- Googleアカウントは `hiroshiandailab@gmail.com` を追加済み。メイン `h@hiroshitt.com` は、サブGmail側でGoogle Drive保存用GASを作成し動作確認後に外す方針

### 第4回グループセッション 設計決定事項（2026-06-09）

| ボタン | 形式 | 保存先 | 手段 | 目的 |
|--------|------|--------|------|------|
| `[最終本文を作成]` | `.docx` | Google Drive | GAS | NotebookLM 連携 |
| `[Markdown生成]` | `.md` | GitHub | REST API + PAT | 変更履歴の追跡 |

### Codex で作業を始めるとき

1. `git pull origin main` で最新を取得
2. 本セクション「作業状況」と `HANDOFF.md` を確認
3. 着手前に `npm run dev` で画面を確認
4. 作業後は **本セクションを更新** してから commit / push
5. Cursor 側は `git pull` で AGENTS.md の更新を取り込む

---

## 既知の注意・過去トラブル

- JSX `<motion>`  typo → ビルド失敗
- `research-card-item.tsx` の文字化け → ファイル再作成で解消済み
- `.tools/gh` はローカル用（`.gitignore` 済み）

---

## 参照

- 詳細引き継ぎ: [`HANDOFF.md`](./HANDOFF.md)
- 起動・デプロイ: [`README.md`](./README.md)
