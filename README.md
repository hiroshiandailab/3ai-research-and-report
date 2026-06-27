# 3AI Research & Report

3AIリサーチと最終レポート作成に特化したNext.jsアプリです。

**GitHub:** https://github.com/hiroshiandailab/3ai-research-and-report

**Vercel本番:** https://3ai-research-and-report.vercel.app

## ローカル設定

```powershell
npm install
Copy-Item .env.example .env.local
```

`.env.local` にGoogle OAuth情報と許可メールを設定します。

```text
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_ALLOWED_EMAILS=allowed@example.com

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

OPENAI_MODEL=gpt-5.5
ANTHROPIC_MODEL=claude-sonnet-4-6
GEMINI_MODEL=gemini-3.5-flash

AI_MAX_OUTPUT_TOKENS=4000
RESEARCH_MAX_RUNS_PER_HOUR=6
RESEARCH_COOLDOWN_SECONDS=30
```

Google OAuthの承認済みリダイレクトURI:

```text
http://localhost:3000/api/auth/callback/google
https://3ai-research-and-report.vercel.app/api/auth/callback/google
```

複数ユーザーを許可する場合、`AUTH_ALLOWED_EMAILS` をカンマ区切りで指定します。

## 起動

```powershell
npm run dev
```

http://localhost:3000 を開くと、未ログイン時は `/login` へ移動します。

## ビルド

```powershell
npm run build
npm run start
```

本番版はサーバー処理を使用するため、静的エクスポートやSurgeへの再デプロイは行いません。
既存のSurge版はモックとして保持し、本番版はVercelで公開しています。

## 認証

- Auth.js + Google OAuth
- 許可メール方式
- APIキーやOAuth Secretはサーバー環境変数のみ
- トップページはサーバー側でセッションを検証
- 各API Routeで `auth()` による認証確認を行う

## 3AIリサーチ

`Research`を実行すると、認証済みのサーバーAPIから3社を並列実行します。

- OpenAI Responses API + Web Search
- Claude Messages API + Web Search Tool
- Gemini API + Google Search grounding
- 1社が失敗しても、成功したAIのレポートは保持
- APIキーはサーバー環境変数だけで管理

3AIの共通点・相違点・出典URLを統合し、成功したAIだけでも比較を生成します。

## 検証

```powershell
npm run test:unit
npm run verify
```

詳細な作業状況は [AGENTS.md](./AGENTS.md) と [HANDOFF.md](./HANDOFF.md) を参照してください。

APIキーの安全な取得・保存・Vercel設定は
[docs/API_KEY_SETUP.md](./docs/API_KEY_SETUP.md)を参照してください。

エラー処理・料金制御・テストは
[docs/ERROR_COST_TESTING.md](./docs/ERROR_COST_TESTING.md)を参照してください。

Vercel本番設定は
[docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)を参照してください。
