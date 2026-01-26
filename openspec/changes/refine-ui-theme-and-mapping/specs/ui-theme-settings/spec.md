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

## MODIFIED Requirements

### Requirement: Theme type definition
テーマタイプは 'light' | 'dark' の2つの値のみを持つ（SHALL）。

以前: `type Theme = 'light' | 'dark' | 'auto'`
現在: `type Theme = 'light' | 'dark'`

#### Scenario: TypeScript型チェック
- **WHEN** 開発者がTheme型の変数を宣言
- **THEN** 'light' または 'dark' のみが許可される
- **AND** 'auto' を設定しようとするとコンパイルエラーが発生

## REMOVED Requirements

### Requirement: Auto theme system preference detection
**Reason**: 自動テーマオプションを削除するため、システム設定の継続的な監視は不要になる。ユーザーは明示的にライトまたはダークを選択する。

### Requirement: Media query change listener for auto theme
**Reason**: 自動テーマがないため、prefers-color-schemeの変更を監視する必要がない。

## Related Capabilities
- `i18n/translations`: 翻訳ファイルから `settings.auto` キーを削除
