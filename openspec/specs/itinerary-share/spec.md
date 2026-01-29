# itinerary-share Specification

## Purpose
TBD - created by archiving change share-password-url-20260129. Update Purpose after archive.
## Requirements
### Requirement: パスワード付き共有URL
システムは旅程の共有URLにパスワードを含めるオプションを提供しなければならない（SHALL）。

#### Scenario: 共有リンク生成
- **WHEN** ユーザーが旅程を保存し共有リンクを表示する
- **THEN** 共有リンクにパスワードを含めたURLが表示される

#### Scenario: パスワード付きURLでの自動認証
- **WHEN** ユーザーがパスワード付き共有URLを開く
- **THEN** システムは自動で認証を行い、認証情報を保存する

#### Scenario: 認証後のURL整理
- **WHEN** 自動認証が成功する
- **THEN** システムはURLからパスワード情報を除去して表示を更新する

#### Scenario: 認証失敗時の案内
- **WHEN** 自動認証に失敗する
- **THEN** システムはエラーを表示し、手動での認証手段を案内する

