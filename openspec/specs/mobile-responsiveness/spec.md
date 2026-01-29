# mobile-responsiveness Specification

## Purpose
TBD - created by archiving change refine-ui-theme-and-mapping. Update Purpose after archive.
## Requirements
### Requirement: Hide action buttons on mobile when modal is open
システムは、モバイル画面で場所選択モーダルが開いている間、保存とプレビューのフローティングボタンを非表示にしなければならない（SHALL）。

#### Scenario: モバイルデバイスでモーダルを開く
- **WHEN** ビューポート幅が768px以下のデバイスでユーザーが場所選択モーダルを開く
- **THEN** 右下の保存ボタン（floatSave）が非表示になる
- **AND** プレビューボタンが非表示になる
- **AND** モーダルが全画面に近い表示になり、ボタンと重ならない

#### Scenario: モバイルデバイスでモーダルを閉じる
- **WHEN** ビューポート幅が768px以下のデバイスでユーザーがモーダルを閉じる（×ボタンまたは背景クリック）
- **THEN** 保存ボタンが再表示される
- **AND** プレビューボタンが再表示される

#### Scenario: デスクトップでモーダルを開く
- **WHEN** ビューポート幅が768pxより大きいデバイスでユーザーが場所選択モーダルを開く
- **THEN** 保存ボタンとプレビューボタンは表示されたまま
- **AND** モーダルとボタンが適切に配置される

### Requirement: Responsive modal sizing
場所選択モーダルは、画面サイズに応じて適切なサイズで表示されなければならない（SHALL）。

#### Scenario: スマートフォンで表示
- **WHEN** ビューポート幅が640px以下の場合
- **THEN** モーダルは画面幅の大部分（padding: 1rem程度）を使用
- **AND** 地図プレビューエリアの高さは h-64 (256px) で表示
- **AND** 検索入力とボタンは縦方向に配置される可能性がある

#### Scenario: タブレットで表示
- **WHEN** ビューポート幅が641px以上768px以下の場合
- **THEN** モーダルはmax-w-lgサイズで表示
- **AND** 地図プレビューエリアの高さは h-80 (320px) で表示

#### Scenario: デスクトップで表示
- **WHEN** ビューポート幅が769px以上の場合
- **THEN** モーダルはmax-w-4xl（最大）サイズで表示
- **AND** 地図プレビューエリアの高さは h-96 (384px) で表示

