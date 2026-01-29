# location-search Specification (Change)

## MODIFIED Requirements
### Requirement: OpenStreetMap integration
システムは、位置情報検索とジオコーディングにOpenStreetMap Nominatim APIを使用し、公式名と住所の両方を取得・保存しなければならない（SHALL）。

#### Scenario: Nominatim APIが正常に応答する
- **WHEN** ユーザーが場所選択モーダルで住所やランドマーク名を入力して検索ボタンをクリック
- **THEN** Nominatim APIに検索クエリを送信
- **AND** APIからの応答に基づいて緯度経度を取得
- **AND** フォーマットされた住所がlocationAddressフィールドに保存される
- **AND** 公式名が取得できる場合はlocationNameフィールドに保存される
- **AND** 公式名が取得できない場合はlocationNameは空のまま
