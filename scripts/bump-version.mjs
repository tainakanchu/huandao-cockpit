#!/usr/bin/env node
/**
 * Bump the app version in both package.json and app.json (expo.version).
 *
 * Usage:
 *   node scripts/bump-version.mjs patch    # 1.2.3 → 1.2.4
 *   node scripts/bump-version.mjs minor    # 1.2.3 → 1.3.0
 *   node scripts/bump-version.mjs major    # 1.2.3 → 2.0.0
 *   node scripts/bump-version.mjs 2.1.0    # explicit
 *
 * Prints the new version to stdout. Does NOT commit or tag — leaves that to
 * the release skill / operator.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

const pkgPath = resolve(root, 'package.json');
const appPath = resolve(root, 'app.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, obj) {
  // Preserve trailing newline like most editors.
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(v);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function bump(current, kind) {
  const { major, minor, patch } = parseSemver(current);
  switch (kind) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Explicit version
      parseSemver(kind); // validate
      return kind;
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: bump-version.mjs <patch|minor|major|x.y.z>');
  process.exit(1);
}

const pkg = readJson(pkgPath);
const app = readJson(appPath);

if (pkg.version !== app.expo.version) {
  console.warn(
    `[warn] package.json (${pkg.version}) and app.json (${app.expo.version}) versions differ. Both will be set to the new value.`,
  );
}

const current = pkg.version;
const next = bump(current, arg);

pkg.version = next;
app.expo.version = next;

writeJson(pkgPath, pkg);
writeJson(appPath, app);

console.log(`${current} → ${next}`);
console.log('');
console.log('Next steps:');
console.log(`  git add package.json app.json`);
console.log(`  git commit -m "chore: bump version to v${next}"`);
console.log(`  git tag v${next}`);
console.log(`  git push origin master && git push origin v${next}`);
