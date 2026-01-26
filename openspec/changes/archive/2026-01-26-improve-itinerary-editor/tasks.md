# Implementation Tasks: improve-itinerary-editor

## Phase 1: パネルUI改善

### 1.1 パネル余白縮小
- [x] CreateItineraryPage.tsxのパネルコンテナで `p-4` を `p-2` に変更
- [x] 内部要素のスペーシングを調整

### 1.2 金額入力欄追加
- [x] StopEntry型に cost フィールドを追加（既存のItineraryItem.costと同様）
- [x] パネル内に金額入力フィールドを追加（場所ボタンの下）
- [x] 通貨セレクター追加（JPY/USD/EUR）
- [x] i18nキー追加: `create.entryCost`, `create.entryCurrency`

### 1.3 日付自動継承
- [x] `updateEntry` 関数で日付変更時に後続パネルをチェック
- [x] 後続パネルの日付が空または古い場合に新日付を設定
- [x] 既に後の日付が設定されているパネルはスキップ

### 1.4 カレンダー日付制限
- [x] 日付入力に `min` 属性を動的設定
- [x] `getMinDateForPanel(index)` ヘルパー関数を実装

### 1.5 場所に基づく絵文字自動設定
- [x] `getAutoEmoji(location: string): string | null` ユーティリティ関数を作成
- [x] キーワードマッピング定義: airport/空港→✈️, station/駅→🚃, hotel/ホテル→🏨, restaurant/レストラン→🍽️, temple/寺→⛩️, castle/城→🏯, beach/ビーチ/海→🏖️, mountain/山→⛰️
- [x] `applyLocationSearch` 内で現在アイコンが📍の場合のみ呼び出し

### 1.6 日付タブフィルタリング
- [x] state追加: `selectedDateFilter: string | null`（nullで全表示）
- [x] `useMemo` でentriesから一意の日付を抽出
- [x] タイトル入力の下にタブバーコンポーネント追加
- [x] 最初のタブ「全て」、以降は各日付（12/31形式）
- [x] 選択タブで表示entriesをフィルタリング
- [x] i18nキー追加: `create.allDates`

**依存**: なし

---

## Phase 2: Geocoding統合

### 2.1 Google Maps Geocoding API設定
- [x] `src/lib/geocoding.ts` を作成
- [x] `geocodeAddress(address: string)` 関数を実装
- [x] 戻り値: `{ lat, lng, formattedAddress }` または失敗時にthrow
- [x] 既存の `VITE_GOOGLE_MAPS_API_KEY` を使用

### 2.2 場所モーダルにGeocoding統合
- [x] `applyLocationSearch` でgeocoding APIを呼び出し
- [x] APIレスポンスでentryのcoordinatesを更新
- [x] 失敗時はトースト表示、テキストのみの場所として保存
- [x] geocoding中のローディング状態を追加
- [x] i18nキー追加: `create.geocodingInProgress`, `create.geocodingFailed`

**依存**: 1.5（geocoding後に絵文字自動設定）

---

## Phase 3: 保存処理

### 3.1 空パネル自動削除
- [x] `handleSave` でAPI呼び出し前にentriesをフィルタ
- [x] `!entry.location.trim() && !entry.memo.trim()` のエントリを除去
- [x] 削除があった場合トースト表示: `create.emptyPanelsRemoved`

**依存**: なし

---

## Phase 4: UI修正

### 4.1 パスワードモーダルのダークモード修正
- [x] パスワード入力フィールドに `bg-white` を追加
- [x] ダークモードでテキストが見えることを確認

**依存**: なし

---

## Phase 5: プレビュー機能

### 5.1 プレビューページ作成
- [x] `src/pages/PreviewItineraryPage.tsx` を作成
- [x] 旅程の整形された読み取り専用ビューをデザイン
- [x] 日付ごとにアイテムをグループ化
- [x] 座標がある場合は表示（地図統合は将来対応）
- [x] 金額サマリーを表示
- [x] App.tsxにルート追加: `/itinerary/:id/preview`

### 5.2 作成ページにプレビューボタン追加
- [x] 保存FABの上に「プレビュー」ボタンを追加
- [x] クリック時、現在の状態をlocalStorageに一時保存
- [x] ローカルデータフラグ付きでプレビューページに遷移
- [x] i18nキー追加: `create.previewButton`, `preview.title`, `preview.backToEdit`

### 5.3 共有ビューに編集ボタン追加
- [x] ItineraryPageで所有者かどうかを検出（localStorageの認証トークン）
- [x] 所有者の場合「編集する」ボタンを表示
- [x] `/create?edit=:id` へリンク
- [ ] editパラメータがある場合、作成ページで既存データをロード（将来対応）
- [x] i18nキー追加: `itinerary.editButton`

**依存**: なし（他フェーズと並行可能）

---

## Phase 6: Basic認証

### 6.1 Basic認証コンポーネント実装
- [x] `src/middleware/BasicAuth.tsx` を作成
- [x] localStorageで有効なセッションをチェック
- [x] 未認証の場合ログインフォームを表示
- [x] 環境変数: `VITE_BASIC_AUTH_USER`, `VITE_BASIC_AUTH_PASS`
- [x] i18nキー追加: `auth.basicTitle`, `auth.basicUsername`, `auth.basicPassword`

### 6.2 アプリをBasic認証でラップ
- [x] App.tsxでルートをBasicAuthで条件付きラップ
- [x] 開発/ステージング環境でのみ有効化（`import.meta.env.MODE` をチェック）

**依存**: なし

---

## 検証チェックリスト

- [x] パネル余白が視覚的に縮小されている
- [x] 各パネルで金額を入力・保存できる
- [x] パネル1で日付設定→パネル2に日付がなければ自動更新
- [x] カレンダーで前のパネルより前の日付が選択不可
- [x] 「東京駅」入力時、アイコンが📍なら🚃に自動変更
- [x] 日付タブが表示され、フィルタリングが正しく動作
- [x] 「設定する」クリックでgeocoding実行、座標が保存される
- [x] 空パネルは保存時に削除される
- [x] ダークモードでパスワード入力欄が白背景
- [x] プレビューで整形された旅程が表示される
- [x] 共有ビューで所有者に編集ボタンが表示される
- [x] 開発モードでBasic認証が未認証アクセスをブロック
