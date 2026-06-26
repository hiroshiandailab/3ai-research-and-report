# APIキー設定手順

APIキーはパスワードと同じ秘密情報です。チャット、メール、GitHub Issue、ソースコードには貼り付けません。

## 安全設計

- ブラウザからAI各社へ直接アクセスしない
- APIキーはNext.jsのサーバー処理だけが参照する
- `NEXT_PUBLIC_`から始まる変数名には絶対に保存しない
- `NEXT_PUBLIC_*_API_KEY`が設定されている場合、アプリは起動時に拒否する
- ローカルはGit管理外の`.env.local`を使用する
- VercelはSensitive環境変数を使用する
- API応答は`Cache-Control: private, no-store`で保存を禁止する
- SDKの詳しいエラーはサーバーログだけに残し、画面へ返さない
- コミット前に`npm run check:secrets`を実行する

## 1. OpenAI

1. https://platform.openai.com/api-keys を自分のブラウザで開く
2. プロジェクト専用のAPIキーを作成する
3. 権限を必要最小限にする
4. Usage / Limitsで月額上限と通知を設定する
5. 表示されたキーを`.env.local`の`OPENAI_API_KEY`へ直接貼り付ける

## 2. Claude

1. https://console.anthropic.com/settings/keys を自分のブラウザで開く
2. 本アプリ専用のWorkspaceまたはキーを作成する
3. 使用上限を設定する
4. キーを`.env.local`の`ANTHROPIC_API_KEY`へ直接貼り付ける

## 3. Gemini

1. https://aistudio.google.com/app/apikey を自分のブラウザで開く
2. 本アプリ専用のGoogle Cloudプロジェクトを選択する
3. 新規作成時はAuthorization keyを使用する
4. Standard keyを使う場合はGenerative Language APIだけに制限する
5. キーを`.env.local`の`GEMINI_API_KEY`へ直接貼り付ける

## 4. ローカル設定

`C:\Users\h\src\3ai-research-and-report\.env.local`をテキストエディターで開き、値だけを入力します。

```text
OPENAI_API_KEY=ここへOpenAIキー
ANTHROPIC_API_KEY=ここへClaudeキー
GEMINI_API_KEY=ここへGeminiキー
```

設定後に開発サーバーを再起動します。

```powershell
npm run check:secrets
npm run test:ai
npm run dev
```

`check:secrets`はGit管理対象だけを検査するため、`.env.local`内のキーを読み上げたり表示したりしません。
`test:ai`は3社へ最小のWeb検索リクエストを送り、回答本文やAPIキーを表示せず接続結果だけを表示します。

## 5. Vercel設定

1. Vercel Dashboardで対象プロジェクトを開く
2. Settings → Environment Variablesを開く
3. 次の変数を1件ずつ追加する
4. APIキーとSecretはSensitiveを有効にする
5. Productionだけでなく、必要な場合のみPreviewにも設定する

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
AUTH_SECRET
AUTH_GOOGLE_SECRET
```

モデル名や許可メールは通常のサーバー環境変数として設定します。

```text
OPENAI_MODEL
ANTHROPIC_MODEL
GEMINI_MODEL
AUTH_GOOGLE_ID
AUTH_ALLOWED_EMAILS
```

環境変数を変更した後は再デプロイします。

## 6. Google Drive保存用GAS

`[最終本文を作成]` からGoogle Driveへ `.docx` 保存する設定は、次の手順書を参照してください。

- `docs/GOOGLE_DRIVE_GAS_SETUP.md`

## 7. GitHub Markdown保存用PAT

`[Markdown生成]` からGitHubへ `.md` 保存する設定は、次の手順書を参照してください。

- `docs/GITHUB_MARKDOWN_SETUP.md`

## 漏えいが疑われる場合

1. 該当キーを各社コンソールですぐ失効する
2. 新しいキーを発行する
3. `.env.local`とVercelを新しい値へ更新する
4. 利用履歴と請求を確認する
5. GitHubへ一度でも入った場合は、履歴削除だけで済ませず必ずキーを失効する
