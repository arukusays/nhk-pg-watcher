## 概要:
- v2 の list API から program-api.nhk.jp の v3 相当エンドポイントに切替える変更を反映し、レスポンス構造に合わせた処理へ更新しました。

## 変更点:
- エンドポイント URL を更新
- publication / name / startDate を使うように修正
- ネットワークと JSON パースのエラーハンドリングを追加
- 重複判定を Set に変更（startDate + name）
- キーワード検索を case-insensitive にし、null 安全化

## 動作確認/注意点:
- キーワード検索は大文字小文字を無視しています。case-sensitive を希望する場合はお知らせください。
- program.id を使った重複判定に戻す必要がある場合は指示ください。

## 作成者へ:
このPRは Copilot によって自動作成されました。