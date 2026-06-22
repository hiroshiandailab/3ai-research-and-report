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

**最終更新:** 2026-06-22
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

### 未着手 / 要確認

- [ ] Google Cloud ConsoleでOAuth Client ID / Secretを発行
- [ ] `.env.local` とVercelへGoogle OAuth環境変数を設定
- [ ] 実Googleアカウントでログイン・許可メール制限を確認
- [ ] OpenAI / Anthropic / Gemini APIキーを`.env.local`とVercelへ設定
- [ ] 3社の実API通信・課金・利用上限を確認
- [ ] **第3段階: 3AI比較・出典統合**
- [ ] **STEP3 `[最終本文を作成]` → Google Drive 保存の実装**
  - 形式: `.docx`（Word）
  - 手段: GAS（Google Apps Script）で直接書き込み
  - 目的: NotebookLM 連携
- [ ] **STEP3 `[Markdown生成]` → GitHub 保存の実装**
  - 形式: `.md`
  - 手段: GitHub REST API + PAT（ユーザーが localStorage に設定）
  - 保存先: `hiroshiandailab/3ai-research-and-report`
  - 目的: 変更履歴の追跡・バージョン管理
- [x] 本番 API（OpenAI / Gemini / Claude）接続コード
- [ ] `research-workbench` との同期方針（凍結 vs マージ）
- [ ] GitHub Pages / Vercel 等の検討（現状 Surge 前提）

### 直近の作業メモ（Cursor 側）

- 月次課題レポート（`personal-workspace-report`）は別 Surge URL。アプリ本体とは独立
- レポート用キャプチャは `C:\Users\h\Desktop\My-First-Project\images\Research Workbench.png`
- `gh` CLI の winget インストールは失敗履歴あり。repo 作成は git credential + API で実施済み

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
