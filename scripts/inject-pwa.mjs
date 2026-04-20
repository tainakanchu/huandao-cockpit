#!/usr/bin/env node
/**
 * Post-build step for Expo Web (output: "single").
 *
 * Injects PWA-required meta tags and the Service Worker registration into
 * dist/index.html. This is needed because `app/+html.tsx` is only honored in
 * `output: "static"` mode; for SPA output we patch the generated HTML.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '..', 'dist');
const htmlPath = resolve(distDir, 'index.html');

if (!existsSync(htmlPath)) {
  console.error(`[inject-pwa] ${htmlPath} not found — run expo export first.`);
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');

const pwaHead = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="環島" />
    <meta name="application-name" content="環島コックピット" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
    <style>
      html, body, #root {
        background-color: #FAF8F5;
        overscroll-behavior-y: none;
        -webkit-tap-highlight-color: transparent;
      }
      body {
        padding: env(safe-area-inset-top) env(safe-area-inset-right)
                 env(safe-area-inset-bottom) env(safe-area-inset-left);
      }
    </style>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').then(function (reg) {
            if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
            reg.addEventListener('updatefound', function () {
              var sw = reg.installing;
              if (!sw) return;
              sw.addEventListener('statechange', function () {
                if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                  sw.postMessage('SKIP_WAITING');
                }
              });
            });
          }).catch(function (err) {
            console.warn('[PWA] SW registration failed:', err);
          });
          var refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });
        });
      }
    </script>`;

// Update viewport for notched devices, promote Expo bundle to `type="module"`
// (Metro's output references `import.meta.env`, which is a SyntaxError in a
// classic script. Modules tolerate `import.meta` and are deferred by default.)
const updatedHtml = html
  .replace(
    /<meta name="viewport"[^>]*\/?>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" />',
  )
  .replace(
    /<script src="(\/_expo\/static\/js\/web\/[^"]+)" defer><\/script>/,
    '<script src="$1" type="module"></script>',
  )
  .replace('</head>', `${pwaHead}\n  </head>`);

writeFileSync(htmlPath, updatedHtml, 'utf8');
console.log('[inject-pwa] injected PWA tags into dist/index.html');
