# Research Workbench / 3AI Research & Report — 引き継ぎメモ

最終更新: 2026-06-25
対象読者: 別チャット・別担当者への引き継ぎ用

---

## 1. プロジェクトは2つある（混同注意）

| 項目 | 既存（Research Workbench） | 新モック（3AI Research & Report） |
|------|---------------------------|-----------------------------------|
| ローカルパス | `C:\Users\h\src\research-workbench` | `C:\Users\h\src\3ai-research-and-report` |
| 画面タイトル | Research Workbench | **3AI Research & Report** |
| Surge URL | https://hiroshi-tsutsumi-202605-workspace.surge.sh/ | https://hiroshi-tsutsumi-202506-3ai-research-and-report.surge.sh/（**新URLのみ**） |
| GitHub | （未確認・別管理の可能性） | https://github.com/hiroshiandailab/3ai-research-and-report |
| 関係 | 元プロジェクト | `research-workbench` のコピー＋ブランディング差分 |

### 絶対守ること

- **既存 Surge URL（202605-workspace）へ再デプロイしない**
- 新モックの作業は `3ai-research-and-report` で行う
- `research-workbench` の `package.json` の `deploy` は旧 URL 向けのまま

---

## 2. 技術スタック

- **Next.js 15.5**（App Router / Server）+ **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **認証**: Auth.js + Google OAuth + `AUTH_ALLOWED_EMAILS`
- **本番方針**: Vercel（Surge版はモックとして凍結）
- **状態**: UI状態はlocalStorage、3AI実行は認証済みサーバーAPI
- **3AI**: OpenAI Responses + Web Search / Claude Messages + Web Search / Gemini + Google Search
- **秘密情報**: `.env.local` / Vercel Sensitive変数のみ。`NEXT_PUBLIC_*_API_KEY`は禁止
- **Google Drive保存**: Next.js Route Handler → GAS Webアプリ → Google Drive `.docx`
- **Node**: `npm install` → `npm run dev`（開発） / `npm run build`（サーバー版ビルド）

---

## 3. 画面構成（3ステップ）

### STEP 1：AIレポートを見る

- **リサーチ対象**（旧 Research Mode）: `[Art]` `[Academic]` `[Business]` — **初期選択 Art**
- **Main Question** — Art 時プレースホルダー:
  - `この情報は、ひろしのAIクリエイター活動・Genmapping・作品制作にどう役立つか？`
- ボタン（**縦並び・右列**）:
  - `[Research]` — 青 `#2563EB`
  - `[3AIレポートを開く]` — 黒背景・白文字 `#0F172A`
- **Markdown生成は STEP 1 にない**（STEP 3 のみ）

### STEP 2：重要文を採用する

- レイアウト: `grid-template-columns: 9fr 3fr`（PC）/ モバイル縦並び
- 左: **AI共通まとめ**（75%）— カード選択可
- 右: **採用する重要文**（25%）— コンパクトカード + **入力用 Textarea**（空時も追記可）
- 右下: **`[選択文を採用する]`** — 青・幅広
- 空メッセージ例: `3AIレポートから重要文を選び「採用する」`

### STEP 3：最終レポートを作る

- 最終レポート本文（Textarea、手動編集可）
- ボタン（右下・この順）:
  1. **`[最終本文を作成]`** — 採用 B 層文を本文へ反映（`reflectAllBToFinalReport`）
  2. **`[Markdown生成]`** — コピー + ダウンロード（緑系 `#0F766E`）
- 上部余白やや広め（`mt-3 pt-2 gap-4`）
- フッター: 検証案作成・再検証・編集・全クリア（小さなサブ操作）

### 3AIレポートモーダル

- タイトル: `3AIレポート`
- タブ: ChatGPT / Gemini / Claude / Compare
- **`[共通点をAI共通まとめへ反映]`** + `[閉じる]`
- 本番レポートは認証済み `/api/research` から取得
- `src/lib/research-mock-ai.ts` は検証案テンプレート用途のみ

---

## 4. デザイン方針（維持）

- 白基調 + 薄い青グレー（研究ノート風）
- 例: 背景 `#F5F8FB`、カード白、ボーダー `#D8E2EC`、本文 `#0F172A`、補助 `#64748B`
- チップ: `#EAF2F8` / `#334155`
- 黒背景 UI に戻さない

---

## 5. 主要ファイル（3ai-research-and-report）

```
src/
  app/
    layout.tsx          # metadata: 3AI Research & Report
    page.tsx            # ResearchWorkbench を表示
    globals.css         # テーマ変数（青グレー）
  components/
    research-workbench.tsx   # メイン UI（3ステップ・ヘッダー）
    ai-reports-modal.tsx     # 3AI モーダル
    research-card-item.tsx   # カード（compact 対応）
  hooks/
    use-research-workbench.ts  # 状態・ダミー Research・採用・反映
  lib/
    research-brief.ts       # ART プレースホルダー
    research-mock-ai.ts     # 検証案テンプレート
    research-markdown.ts    # Markdown 出力
    research-storage.ts     # localStorage
  types/
    research.ts           # WorkspaceState, WORKFLOW_STEPS, BOARD_PANELS
```

### データモデル（内部）

- カード層 **A** = UI「AI共通まとめ」
- 層 **B** = 「採用する重要文」
- 層 **C** = 最終レポート関連（検証案など）
- `mode`: ACADEMIC | BUSINESS | ART（デフォルト **ART**）
- `lockProfile`: FULL | LITE（**UI からは削除済み**、state は残存）

---

## 6. MVP 機能チェックリスト

- [x] リサーチ対象選択（Art 初期）
- [x] Main Question 入力
- [x] Research → OpenAI / Claude / Geminiを並列実行
- [x] 3AI モーダル・タブ切替
- [x] Compare → AI共通まとめへ反映
- [x] 共通まとめから文選択 → 採用
- [x] 採用パネル手入力追加（Textarea）
- [x] 最終本文を作成 → finalReport 反映
- [x] 手動編集 + Markdown 生成・コピー
- [x] **本番3AI API接続コード**
- [x] Google OAuth設定・許可アカウントでのログイン確認
- [x] OpenAI / Claudeのライブ通信確認
- [ ] Gemini生成確認（APIキーは有効、2026-06-25時点も利用枠超過）
- [ ] 3AI比較・出典統合（第3段階）
- [x] Google Drive保存用GAS連携コード
- [ ] Google Drive保存の実Driveテスト（GAS WebアプリURL・共有シークレット設定後）

---

## 7. コマンド早見表（3ai-research-and-report）

```powershell
cd C:\Users\h\src\3ai-research-and-report

# 開発
npm run dev
# → http://localhost:3000

# ビルド（サーバー版）
npm run build

# 秘密情報・lint・本番ビルド
npm run verify

# 3社APIの最小ライブ通信
npm run test:ai

# Google Drive .docx保存テスト
npm run test:drive
```

Google OAuth callback:

```text
http://localhost:3000/api/auth/callback/google
https://<Vercel本番ドメイン>/api/auth/callback/google
```

### GitHub

```powershell
git remote -v
# origin  https://github.com/hiroshiandailab/3ai-research-and-report.git

git push origin main
```

- 初回コミット済み（`main`）
- 組織アカウント: **hiroshiandailab**（個人 `hiroshiandai` ではない）

---

## 8. 作業履歴（時系列要約）

1. **Research Workbench** — 3ステップ UI、Evidence Board、モーダル、ライトテーマへ大規模リファクタ
2. **配色** — 白 + 薄青グレー研究ノート風、`globals.css` 変数更新
3. **STEP 1** — Lock 削除 → 後に Art/Academic/Business 復活、「リサーチ対象」ラベル、Deep Research 表示は廃止、ボタン縦並び、3AI ボタン黒
4. **STEP 2** — 9:3 グリッド、採用ボタン右下・青・「選択文を採用する」、右パネル入力枠化
5. **STEP 3** — Markdown を STEP3 へ、「最終本文を作成」、ボタン右下
6. **細部** — Art デフォルト、文言・余白調整
7. **3ai モック** — `research-workbench` をコピー → `3ai-research-and-report`、タイトル・deploy URL・モーダル文言差分
8. **GitHub** — `hiroshiandailab/3ai-research-and-report` 作成・push 済み
9. **Surge 新 URL** — ローカル build 成功。**本番デプロイはユーザー確認待ちの可能性あり**（要確認）

---

## 9. 既知の注意・過去トラブル

- JSX で誤って `<motion>` タグを書くとビルド失敗 → 必ず `<div>`
- `research-card-item.tsx` の日本語文字化けが一度発生 → ファイル再作成で解消
- PowerShell では `&&` 不可 → `;` を使用
- `gh` winget インストールは失敗したが、git credential + API で repo 作成は成功
- `.tools/gh` はローカル用（`.gitignore` に追加済み）

---

## 10. 次にやりそうなこと（未確定）

- [x] Surgeモック版へのデプロイ確認
- [ ] Vercel本番プロジェクトの作成・公開（第7段階）
- [x] 本番 API（OpenAI / Gemini / Claude）接続コード
- [x] Google OAuth・OpenAI・Claudeのローカル実通信確認
- [ ] Geminiの利用枠有効化・生成再確認
- [ ] `hiroshiandailab@gmail.com` 側でGASを作成し、`.docx` Drive保存を実テスト
- [ ] 3AI比較・出典統合
- [ ] `research-workbench` 側を 3ai と同期するか、レガシーとして凍結するか方針決定
- [ ] Vercel本番プロジェクトの作成・環境変数設定（第7段階）

### Googleアカウント移行メモ（2026-06-25）

- `hiroshiandailab@gmail.com` を追加済み
- メイン `h@hiroshitt.com` は、サブGmail側でGoogle Drive保存用GASを作成し動作確認後に外す方針

---

## 11. ユーザー要望の原文キーワード（参照用）

- ひろし専用 AI クリエイター活動リサーチ作業台 → **Art デフォルト**
- 既存 URL 変更禁止 / 新 URL のみ公開
- 3AI Research & Report という製品名
- 操作はシンプル、ボタン増やしすぎない

---

## 12. 関連パス・URL 一覧

| 名称 | URL / パス |
|------|------------|
| 既存 Surge | https://hiroshi-tsutsumi-202605-workspace.surge.sh/ |
| 新 Surge | https://hiroshi-tsutsumi-202506-3ai-research-and-report.surge.sh/ |
| GitHub | https://github.com/hiroshiandailab/3ai-research-and-report |
| ローカル（3ai） | `C:\Users\h\src\3ai-research-and-report` |
| ローカル（既存） | `C:\Users\h\src\research-workbench` |

---

*このファイルを別チャットに貼るか、`HANDOFF.md` を @ 参照してください。*
