# 3AI Research & Report

3AIリサーチと最終レポート作成に特化したNext.jsアプリです。

**GitHub:** https://github.com/hiroshiandailab/3ai-research-and-report

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
```

Google OAuthの承認済みリダイレクトURI:

```text
http://localhost:3000/api/auth/callback/google
https://<Vercel本番ドメイン>/api/auth/callback/google
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
既存のSurge版はモックとして保持し、最終的な公開先はVercelです。

## 認証

- Auth.js + Google OAuth
- 許可メール方式
- APIキーやOAuth Secretはサーバー環境変数のみ
- トップページはサーバー側でセッションを検証
- 今後追加する各API Routeでも `auth()` による認証確認を行う

詳細な作業状況は [AGENTS.md](./AGENTS.md) と [HANDOFF.md](./HANDOFF.md) を参照してください。
