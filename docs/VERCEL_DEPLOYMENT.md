# Vercel本番公開

## 公開先

- 本番URL: https://3ai-research-and-report.vercel.app
- Vercelチーム: `hiroshiandailab's projects`
- Vercelプロジェクト: `3ai-research-and-report`
- GitHubブランチ: `main`

GitHubの`main`へpushすると、VercelのProductionへ自動デプロイされます。Surge版はモックとして凍結し、再デプロイしません。

## Production環境変数

次の13項目をVercelのSensitive変数としてProductionのみに設定しています。

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_ALLOWED_EMAILS
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
GOOGLE_DRIVE_GAS_WEB_APP_URL
GOOGLE_DRIVE_GAS_SHARED_SECRET
GITHUB_REPORT_TOKEN
AI_MAX_OUTPUT_TOKENS
RESEARCH_MAX_RUNS_PER_HOUR
RESEARCH_COOLDOWN_SECONDS
```

Previewには秘密情報を設定していないため、ブランチPreviewでは認証・外部API機能を使用できません。

## Google OAuth

- Google Cloudプロジェクト: `ai-report-500313`
- OAuthクライアント: `AI-Report-Web`
- 管理アカウント: `hiroshiandailab@gmail.com`（オーナー）

承認済みのJavaScript生成元:

```text
http://localhost:3000
https://3ai-research-and-report.vercel.app
```

承認済みのリダイレクトURI:

```text
http://localhost:3000/api/auth/callback/google
https://3ai-research-and-report.vercel.app/api/auth/callback/google
```

## 本番確認結果

- Vercel Productionビルド: Ready
- 未認証アクセス: `/login`へ移動
- `hiroshiandailab@gmail.com`: Googleログイン成功
- PC表示: 1440x900で重なりなし
- スマートフォン表示: 390x844で重なりなし
- OpenAI: 本番Vercelから実通信成功
- Claude: 本番Vercelから実通信成功
- Gemini: APIキー有効、生成利用枠超過を日本語エラーで表示
- Google Drive / GitHub: ローカル実保存確認済み、Production環境変数登録済み
