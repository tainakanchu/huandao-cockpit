---
description: Bump the app version and cut a release (auto-creates tag + triggers Android APK build + GitHub Release)
---

# /release — リリースを 1 コマンドで切る

`package.json` / `app.json` のバージョンを上げ、コミット・タグ付け・push
まで自動で行う。タグ push を検知して CI (`release-android.yml`) が
Android APK をビルドして GitHub Release を自動作成する。

## 引数 ($ARGUMENTS)

- `patch` (既定) → 1.2.3 → 1.2.4
- `minor` → 1.2.3 → 1.3.0
- `major` → 1.2.3 → 2.0.0
- `1.2.3` → 具体バージョンへ差し替え
- `--dry-run` → bump のみ、commit/tag/push しない

## 手順（自動実行）

1. **ワーキングツリー確認**
   - `git status --short` でクリーンか確認
   - 汚れていたら停止、ユーザに「先にコミット整理してください」と報告

2. **バージョン bump**
   - `pnpm run version:bump <引数>` を実行
   - 新バージョン X.Y.Z を控える

3. **差分とリリース計画を提示してユーザ確認 (1 回のみ)**
   - `git diff package.json app.json` の要点を示す
   - 「v<NEW> として以下を一括で実行します:
     - commit 「chore: bump version to v<NEW>」
     - tag v<NEW> 作成
     - master と v<NEW> を origin に push
     - タグ push で CI が APK ビルド + GitHub Release 作成を自動実行
     進めてよいですか？」
   - ユーザが承認したら次へ。拒否 or 不明瞭なら `git checkout package.json app.json`
     で revert して終了

4. **コミット**
   ```
   git add package.json app.json
   git commit -m "chore: bump version to v<NEW>"
   ```

5. **タグ作成**
   ```
   git tag v<NEW>
   ```

6. **push（master と tag 両方）**
   ```
   git push origin master
   git push origin v<NEW>
   ```

7. **完了報告**
   - 新バージョン
   - 以下の URL を案内:
     - Actions: `https://github.com/tainakanchu/huandao-cockpit/actions`
     - Release (完成後): `https://github.com/tainakanchu/huandao-cockpit/releases/tag/v<NEW>`

## 引数なしの場合

引数が指定されなかったら、まずユーザに `patch` / `minor` / `major` を
選ばせる（デフォルトは `patch`）。

## 制約

- `--no-verify`・`--force-push` は使わない
- ユーザが master ブランチ以外にいる場合は警告して停止
- Cloudflare Pages への Web デプロイは master push で別途走る（別系統）
