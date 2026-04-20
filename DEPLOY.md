# PWA デプロイ手順

Cloudflare Pages の Git 連携で master への push 時に自動デプロイします。

## 初回セットアップ (GUI)

### 1. Cloudflare Pages プロジェクトを作成

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub リポジトリ `tainakanchu/huandao-cockpit` を選択
3. ビルド設定:
   | 項目 | 値 |
   |-----|---|
   | Project name | `huandao-cockpit` |
   | Production branch | `master` |
   | Framework preset | `None` |
   | Build command | `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm run web:build` |
   | Build output directory | `dist` |
   | Root directory | `/` |
4. **Save and Deploy**

以降、`master` への push で自動デプロイ、プルリクでプレビューデプロイが走ります。
本番 URL: `https://huandao-cockpit.pages.dev`

### 2. ローカルから手動デプロイする場合 (任意)

```bash
pnpm run web:deploy
```
初回のみ Cloudflare 認証あり。

## iPhone で PWA として使う

1. Safari で `https://huandao-cockpit.pages.dev` を開く
2. 共有ボタン → 「ホーム画面に追加」
3. ホーム画面のアイコンから起動するとスタンドアロンモードで開く
4. 初回オンライン起動後は、オフラインでも前回取得データで動作する

## 構成

- `public/manifest.webmanifest`: Web App Manifest (iOS/Android 共通)
- `public/sw.js`: Service Worker (オフラインキャッシュ)
  - アプリシェル: network-first → cache fallback
  - 静的アセット: cache-first
  - Open-Meteo API: stale-while-revalidate
- `public/_headers`: Cloudflare Pages のキャッシュ制御
- `scripts/inject-pwa.mjs`: `expo export` 後に `dist/index.html` へ manifest/SW を注入
- `wrangler.toml`: ローカル `wrangler` CLI 用設定

## 更新の反映

Service Worker が新バージョンを自動検出し、次回起動時にリロードします。強制リセットしたい場合は `public/sw.js` の `VERSION` 定数を変更してください。
