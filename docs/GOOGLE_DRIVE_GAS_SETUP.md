# Google Drive保存用GAS設定手順

`[最終本文を作成]` ボタンで作成した本文を、Google Driveへ `.docx` として保存するための設定です。

## 安全設計

- GASのURLと共有シークレットはNext.jsサーバーだけが参照する
- ブラウザにはGAS共有シークレットを渡さない
- `.env.local` とVercel環境変数にのみ保存する
- `NEXT_PUBLIC_` から始まる変数名には保存しない
- GASは `GOOGLE_DRIVE_GAS_SHARED_SECRET` が一致したリクエストだけ処理する

## 1. GASプロジェクトを作成

1. `hiroshiandailab@gmail.com` でGoogleにログインする
2. https://script.google.com/ を開く
3. 新しいプロジェクトを作成する
4. プロジェクト名を `3AI Research Report Drive Save` にする
5. `gas/google-drive-save/Code.gs` の内容を `Code.gs` へ貼り付ける

## 2. スクリプトプロパティを設定

GASエディタ左側の「プロジェクトの設定」から「スクリプト プロパティ」を追加します。

```text
GOOGLE_DRIVE_GAS_SHARED_SECRET=十分に長いランダム文字列
GOOGLE_DRIVE_FOLDER_ID=保存先Google DriveフォルダID
```

`GOOGLE_DRIVE_FOLDER_ID` は任意です。未設定の場合はマイドライブ直下に保存されます。

## 3. Webアプリとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 種類は「ウェブアプリ」
3. 実行ユーザーは「自分」
4. アクセスできるユーザーは「全員」または「リンクを知っている全員」
5. デプロイ後に表示されるWebアプリURLを控える

共有シークレットで保護するため、アプリ側からはこのURLへサーバー経由でアクセスします。

## 4. `.env.local` に設定

`C:\Users\h\src\3ai-research-and-report\.env.local` へ次を追加します。

```text
GOOGLE_DRIVE_GAS_WEB_APP_URL=GASのWebアプリURL
GOOGLE_DRIVE_GAS_SHARED_SECRET=スクリプトプロパティと同じ文字列
```

値を追加した後、開発サーバーを再起動します。

## 5. 保存テスト

```powershell
npm run test:drive
```

成功すると、Driveに `3AI Research Report Drive Test_日時.docx` が作成され、URLが表示されます。

アプリ画面では `[最終本文を作成]` を押すと、最終本文の作成後にGoogle Drive保存が実行されます。
