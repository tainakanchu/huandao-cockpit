/**
 * Build-time embedded commit SHA.
 *
 * Populated by `web:build` script which passes either:
 *  - `CF_PAGES_COMMIT_SHA` (Cloudflare Pages build env)
 *  - local `git rev-parse --short HEAD`
 *  - fallback "dev"
 *
 * Metro inlines `process.env.EXPO_PUBLIC_*` at bundle time, so this is a
 * static string in the built JS.
 */
const raw = process.env.EXPO_PUBLIC_GIT_SHA ?? 'dev';

/** Short (7-char) SHA, or 'dev' when no git info was available. */
export const VERSION = raw.length > 7 ? raw.slice(0, 7) : raw;
