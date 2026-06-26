# GitHub Markdown保存設定手順

`[Markdown生成]` ボタンで作成した `.md` を、GitHubへ保存するための設定です。

## 安全設計

- GitHub PATはNext.jsサーバーだけが参照する
- ブラウザ・localStorage・画面表示にはPATを置かない
- `.env.local` とVercel Sensitive環境変数にのみ保存する
- `NEXT_PUBLIC_` から始まる変数名には保存しない
- GitHub REST APIで `reports/YYYY-MM-DD/*.md` に新規ファイルとして保存する

## 1. GitHub PATを作成

GitHubのFine-grained personal access tokenを推奨します。

1. https://github.com/settings/personal-access-tokens を開く
2. 「Generate new token」を選ぶ
3. Repository accessで `hiroshiandailab/3ai-research-and-report` だけを選ぶ
4. Repository permissionsで `Contents: Read and write` を付与する
5. 期限を短めに設定する
6. 作成されたPATを `.env.local` に直接貼り付ける

Classic PATを使う場合は、必要最小限の `repo` 権限にします。

## 2. `.env.local` に設定

`C:\Users\h\src\3ai-research-and-report\.env.local` に次を追加します。

```text
GITHUB_REPORT_TOKEN=GitHub PAT
```

保存先を明示したい場合は、次も設定できます。

```text
GITHUB_REPORT_OWNER=hiroshiandailab
GITHUB_REPORT_REPO=3ai-research-and-report
GITHUB_REPORT_BRANCH=main
GITHUB_REPORT_DIR=reports
```

設定後に開発サーバーを再起動します。

## 3. 保存テスト

```powershell
npm run test:github
```

成功すると、GitHubに `reports/YYYY-MM-DD/github-markdown-save-test-日時.md` が作成され、URLが表示されます。

アプリ画面では `[Markdown生成]` を押すと、従来どおりコピー・ダウンロードした後、GitHubへ `.md` 保存を実行します。
