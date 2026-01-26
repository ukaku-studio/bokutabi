# Implementation Tasks: refine-itinerary-editor-ux

## Phase 1: 入力欄・ボタンの修正

### 1.1 金額入力欄のスピンボタン非表示
- [x] `type="number"` に `inputMode="numeric"` を追加
- [x] CSSクラス追加: `[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`
- [x] 動作確認: Chrome, Firefox, Safari

### 1.2 プレビューボタンのレスポンシブ対応
- [x] 固定サイズ `h-12 w-12` を削除
- [x] `px-4 py-2 whitespace-nowrap` に変更
- [x] テキストサイズはそのまま（text-xs）

**依存**: なし

---

## Phase 2: 日付タブ改善

### 2.1 日付タブに曜日追加
- [x] `getDayOfWeek` を使用して曜日を取得
- [x] ラベル形式を `12/31` から `12/31(火)` に変更

### 2.2 フィルタ適用中のパネル追加
- [x] `!selectedDateFilter` 条件を削除
- [x] `insertEntryAt` で新パネルに選択中の日付を自動設定
- [x] 日付タブフィルタの更新ロジック確認

**依存**: なし

---

## Phase 3: パネル削除機能

### 3.1 削除ボタン追加
- [x] パネル右上に削除ボタン（×アイコン）を追加
- [x] スタイル: 小さな丸ボタン、hover時に色変化

### 3.2 削除確認モーダル
- [x] state追加: `deleteConfirmIndex: number | null`
- [x] パネルが初期値と異なるかチェックする関数 `isEntryModified(entry)` を実装
- [x] 確認モーダルUIを実装（シンプルなダイアログ）
- [x] i18nキー追加: `create.deleteConfirmTitle`, `create.deleteConfirmMessage`, `create.deleteConfirmYes`, `create.deleteConfirmNo`

### 3.3 削除ロジック
- [x] `deleteEntry(index)` 関数を実装
- [x] 最後の1パネルの場合はリセットのみ（削除しない）

**依存**: なし

---

## Phase 4: パネルレイアウト変更

### 4.1 要素順序の変更
- [x] 日時入力の後にメモ欄を移動
- [x] その後に場所ボタン、金額欄

### 4.2 プレースホルダ変更
- [x] ja.json: `create.entryMemoPlaceholder` を「プランの詳細（任意）」に変更
- [x] en.json: `create.entryMemoPlaceholder` を "Plan details (optional)" に変更

**依存**: なし

---

## 検証チェックリスト

- [x] 金額欄でスピンボタンが表示されない（Chrome, Firefox, Safari）
- [x] プレビューボタンが「プレビュー」の文字幅に収まる
- [x] 日付タブに曜日が表示される（例: 12/31(火)）
- [x] フィルタ適用中でもプラスボタンが表示され、追加可能
- [x] 削除ボタンクリックで変更がある場合は確認モーダルが表示
- [x] パネル内でメモ欄が日時の下に配置される
- [x] プレースホルダが「プランの詳細（任意）」になっている
