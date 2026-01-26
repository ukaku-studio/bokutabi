# OpenSpec ガイド

OpenSpecはスペック駆動開発のためのツールです。変更提案（proposal）を作成し、承認後に実装を行います。

## ディレクトリ構成

```
openspec/
├── project.md              # プロジェクト規約
├── specs/                  # 実装済みの仕様
│   └── [capability]/spec.md
├── changes/                # 変更提案
│   ├── [change-id]/
│   │   ├── proposal.md     # 提案内容（なぜ・何を）
│   │   ├── tasks.md        # 実装タスク
│   │   ├── design.md       # 技術設計（任意）
│   │   └── specs/          # スペック差分
│   └── archive/            # 完了した変更
```

## 変更提案ワークフロー

**提案が必要な場合:**
- 新機能の追加
- 破壊的変更（API、スキーマ）
- アーキテクチャ変更

**提案不要な場合:**
- バグ修正、タイポ、コメント修正
- 依存関係の更新（非破壊的）

### 手順

1. 現状確認: `openspec list` と `openspec list --specs`
2. ディレクトリ作成: `changes/[change-id]/`
3. `proposal.md` を作成:
   ```markdown
   # Change: [変更の概要]
   ## Why
   [動機・課題]
   ## What Changes
   - [変更点リスト]
   ## Impact
   - 影響するスペック: [リスト]
   ```
4. `tasks.md` を作成:
   ```markdown
   ## 1. 実装
   - [ ] 1.1 タスク内容
   - [ ] 1.2 タスク内容
   ```
5. スペック差分を作成: `specs/[capability]/spec.md`
6. 検証: `openspec validate [change-id] --strict`
7. 承認を待ってから実装開始

## 実装ワークフロー

1. `proposal.md` を読む
2. `design.md` を読む（存在する場合）
3. `tasks.md` のタスクを順番に実装
4. 完了後、タスクを `- [x]` に更新

## spec.md フォーマット

### 差分操作

```markdown
## ADDED Requirements
### Requirement: 機能名
システムは〜を提供しなければならない（SHALL）。

#### Scenario: 成功ケース
- **WHEN** ユーザーがアクションを実行
- **THEN** 期待される結果

## MODIFIED Requirements
### Requirement: 既存機能名
[修正後の完全な要件]

## REMOVED Requirements
### Requirement: 削除機能名
**Reason**: [削除理由]
```

**重要: シナリオ形式**
```markdown
#### Scenario: シナリオ名    ← 正しい（####を使用）
- **Scenario: 名前**        ← 間違い
**Scenario**: 名前          ← 間違い
```

各要件には最低1つの `#### Scenario:` が必要です。

---
スペック = 実装済みの真実 / 変更 = 提案中
