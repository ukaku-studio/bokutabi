# travel-time-suggestions Specification

## Purpose
TBD - created by archiving change suggest-travel-time-autofill. Update Purpose after archive.
## Requirements
### Requirement: Offer mock travel-time suggestions for consecutive stops
システムは、連続するパネル間の移動時間候補をOpenStreetMapのルーティング結果から算出して提示しなければならない（SHALL）。ルーティングが利用できない場合はモック候補にフォールバックする（SHALL）。

#### Scenario: ルーティング候補を表示する
- **WHEN** entry Nに時刻と場所が設定され、entry N+1に場所が設定されている
- **AND** 両方のパネルに座標が保存されている
- **THEN** ルーティングの移動時間を候補として表示する

#### Scenario: ルーティング不可のフォールバック
- **WHEN** ルーティング取得に失敗する、または座標がない
- **THEN** 既存のモック候補を表示する

### Requirement: Apply selected suggestion with date rollover
The system SHALL apply the selected suggestion to the next stop’s time (and date when crossing midnight).

#### Scenario: Same-day arrival
- **WHEN** a user selects a suggestion that does not cross midnight
- **THEN** the system sets the next stop time on the same date

#### Scenario: Midnight rollover
- **WHEN** a user selects a suggestion that crosses midnight
- **THEN** the system advances the date and sets the new time accordingly

### Requirement: Confirm overwrites
The system SHALL request confirmation before overwriting an existing time value.

#### Scenario: Existing time present
- **WHEN** the next stop already has a time and the user selects a suggestion
- **THEN** the system asks for confirmation before applying the update

