# エラー処理・料金制御・テスト

第6段階で追加した、本番運用前の保護設定です。

## 料金制御

既定値は次のとおりです。必要な場合だけ `.env.local` またはVercel環境変数で変更します。

```text
AI_MAX_OUTPUT_TOKENS=4000
RESEARCH_MAX_RUNS_PER_HOUR=6
RESEARCH_COOLDOWN_SECONDS=30
```

- 3AIそれぞれの最大出力量を4000トークンに制限
- 許可ユーザーごとにResearchを1時間6回までに制限
- Researchの再実行には30秒の間隔を設定
- Main Questionは既存どおり最大4000文字
- 各AI通信は90秒でタイムアウトし、SDKの自動再試行は行わない

回数制限はサーバープロセス内で管理するため、Vercelの再起動や複数インスタンスをまたぐ厳密な月額上限ではありません。単一ユーザーMVPの誤操作・連打防止として使用し、将来複数ユーザーへ公開する場合は永続ストア型のレート制限へ移行します。

## エラー処理

- API設定不備
- API認証失敗
- 利用枠超過・429
- 通信タイムアウト
- 外部サービス一時停止
- その他の通信失敗

上記を利用者向けの日本語メッセージへ変換します。SDKの詳細やAPIキー、GitHub PATは画面へ返さず、サーバーログでも伏字にします。3AIの一部が失敗した場合は、成功したAIの回答と比較結果を保持します。

## テスト

外部APIを呼ばず、料金が発生しない単体テストです。

```powershell
npm run test:unit
```

秘密情報検査・lint・単体テスト・本番ビルドをまとめて実行します。

```powershell
npm run verify
```

実API確認は必要なときだけ個別に実行します。

```powershell
npm run test:ai
npm run test:drive
npm run test:github
```
