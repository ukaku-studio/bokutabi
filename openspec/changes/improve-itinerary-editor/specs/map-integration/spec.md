# Map Integration

## MODIFIED Requirements

### Requirement: 住所はGeocodingで座標に変換される
ユーザーが場所ピッカーモーダルで場所を確定したとき、システムは自動的にGoogle Maps Geocoding APIを呼び出して座標を取得しなければならない（SHALL）。

#### Scenario: 場所確定時のGeocoding実行
- **WHEN** ユーザーが検索フィールドに場所名を入力する
- **AND** 「設定する」ボタンをクリックする
- **THEN** システムはクエリでGoogle Maps Geocoding APIを呼び出す
- **AND** 緯度、経度、フォーマット済み住所を取得する
- **AND** パネルデータに座標を保存する
- **AND** API呼び出し中はローディングインジケータを表示する

#### Scenario: Geocoding成功時のパネル更新
- **WHEN** geocoding APIが正常に結果を返す
- **THEN** パネルのcoordinatesフィールドが更新される
- **AND** フォーマット済み住所が場所名の下に表示される
- **AND** 場所キーワードに基づく絵文字自動設定ロジックがトリガーされる

#### Scenario: Geocoding失敗時のグレースフルフォールバック
- **WHEN** geocoding APIが失敗するか結果がない
- **THEN** 場所テキストは座標なしで保存される
- **AND** トースト通知でユーザーに知らせる：「位置情報が見つかりませんでした」
- **AND** アイテムは保存・表示可能（地図マーカーなし）

#### Scenario: Geocodingローディング状態
- **WHEN** geocoding API呼び出しが進行中
- **THEN** 「設定する」ボタンにローディングスピナーを表示する
- **AND** 呼び出し完了までボタンは無効化される
