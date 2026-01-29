# travel-time-suggestions Specification (Change)

## MODIFIED Requirements
### Requirement: Offer mock travel-time suggestions for consecutive stops
システムは、連続するパネル間の移動時間候補をOpenStreetMapのルーティング結果から算出して提示しなければならない（SHALL）。ルーティングが利用できない場合はモック候補にフォールバックする（SHALL）。

#### Scenario: ルーティング候補を表示する
- **WHEN** entry Nに時刻と場所が設定され、entry N+1に場所が設定されている
- **AND** 両方のパネルに座標が保存されている
- **THEN** ルーティングの移動時間を候補として表示する

#### Scenario: ルーティング不可のフォールバック
- **WHEN** ルーティング取得に失敗する、または座標がない
- **THEN** 既存のモック候補を表示する
