# Location Search and Geocoding

## ADDED Requirements

### Requirement: OpenStreetMap integration
システムは、位置情報検索とジオコーディングにOpenStreetMap Nominatim APIを使用しなければならない（SHALL）。

#### Scenario: ユーザーが場所を検索する
- **WHEN** ユーザーが場所選択モーダルで住所やランドマーク名を入力して検索ボタンをクリック
- **THEN** Nominatim APIに検索クエリを送信
- **AND** APIからの応答に基づいて緯度経度を取得
- **AND** フォーマットされた住所を取得

#### Scenario: Nominatim APIが正常に応答する
- **WHEN** Nominatim APIが有効な位置情報を返す
- **THEN** 緯度と経度がエントリのcoordinatesフィールドに保存される
- **AND** フォーマットされた住所がlocationフィールドに保存される
- **AND** モーダルが閉じる

### Requirement: Geocoding failure handling with user feedback
システムは、ジオコーディングが失敗した場合にユーザーに明確なフィードバックを提供しなければならない（SHALL）。

#### Scenario: Nominatim APIが位置情報を見つけられない
- **WHEN** 検索クエリに対してNominatim APIが結果を返さないまたはエラーを返す
- **THEN** 地図プレースホルダーエリア（灰色の画面）にエラーメッセージを表示
- **AND** メッセージは「位置情報を取得できませんでしたが、ラベルとして保存します」と表示
- **AND** ユーザーが入力したテキストはlocationフィールドにラベルとして保存される
- **AND** coordinatesフィールドはnullのまま

#### Scenario: ネットワークエラーが発生する
- **WHEN** Nominatim APIへのリクエストがネットワークエラーで失敗
- **THEN** 地図プレースホルダーエリアにエラーメッセージを表示
- **AND** ユーザーは入力したテキストをラベルとして保存できる
- **AND** トーストメッセージで「この場所の座標を取得できませんでした」を表示

### Requirement: Leaflet map display
システムは、座標付きの場所をLeafletマップコンポーネントで表示しなければならない（SHALL）。

#### Scenario: 旅程に座標付きの場所が含まれる
- **WHEN** ユーザーが旅程ページで地図を表示
- **THEN** Leafletマップがレンダリングされる
- **AND** OpenStreetMapタイルレイヤーが表示される
- **AND** 各場所がマーカーで表示される

#### Scenario: マーカーをクリックする
- **WHEN** ユーザーが地図上のマーカーをクリック
- **THEN** その場所の情報ウィンドウ（ポップアップ）が表示される
- **AND** 場所名と住所が表示される

### Requirement: No Google Maps dependencies
システムは、Google Maps APIまたは関連ライブラリに依存してはならない（SHALL NOT）。

#### Scenario: ビルド時の依存関係チェック
- **WHEN** package.jsonを確認
- **THEN** `@react-google-maps/api` は含まれていない
- **AND** `@googlemaps/js-api-loader` は含まれていない
- **AND** `leaflet` と `react-leaflet` が含まれている

## MODIFIED Requirements

### Requirement: Geocoding function signature
ジオコーディング関数はNominatim APIのレスポンス形式に合わせて更新される（SHALL）。

以前: Google Maps Geocoding API形式
現在: Nominatim API形式

#### Scenario: geocodeAddress関数を呼び出す
- **WHEN** `geocodeAddress(address: string)` を呼び出す
- **THEN** Nominatim APIエンドポイント `https://nominatim.openstreetmap.org/search` にリクエスト
- **AND** レスポンスから緯度、経度、display_nameを抽出
- **AND** `{ lat: number, lng: number, formattedAddress: string }` 形式で返す

## REMOVED Requirements

### Requirement: Google Maps API key configuration
**Reason**: Google Maps APIを使用しなくなるため、APIキーの設定や検証は不要。OpenStreetMapのNominatimは公開APIで、キー不要（ただし利用規約あり）。

### Requirement: Google Maps JavaScript API loading
**Reason**: `@react-google-maps/api`の`useLoadScript`フックは不要。Leafletは直接インポートして使用。

## Related Capabilities
- `ui/mobile-responsiveness`: モバイルでの地図モーダル表示
- `ui/theme-settings`: ダークモードでの地図タイル選択（オプション）
