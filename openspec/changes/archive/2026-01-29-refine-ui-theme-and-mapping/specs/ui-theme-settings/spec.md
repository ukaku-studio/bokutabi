# UI Theme Settings

## ADDED Requirements

### Requirement: Binary theme selection
システムは、ライトとダークの2つのテーマオプションのみを提供しなければならない（SHALL）。

#### Scenario: ユーザーがテーマを選択する
- **WHEN** ユーザーがホーム画面のクイック設定でテーマボタンをクリック
- **THEN** ライトまたはダークの2つの選択肢のみが表示される
- **AND** 「自動」オプションは表示されない

#### Scenario: テーマ設定が永続化される
- **WHEN** ユーザーがテーマを選択
- **THEN** 選択されたテーマがlocalStorageに保存される
- **AND** 次回訪問時に同じテーマが適用される

### Requirement: Existing auto theme migration
システムは、既存の「自動」テーマ設定を持つユーザーを適切に移行しなければならない（SHALL）。

#### Scenario: 既存ユーザーが自動テーマ設定を持っている
- **WHEN** localStorageに theme='auto' が保存されているユーザーがアプリを開く
- **THEN** システムの外観設定（prefers-color-scheme）を一度だけチェック
- **AND** dark が優先される場合は 'dark' に設定
- **AND** そうでない場合は 'light' に設定
- **AND** 移行後の設定をlocalStorageに保存

## Related Capabilities
- `i18n/translations`: 翻訳ファイルから `settings.auto` キーを削除
