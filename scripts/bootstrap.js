#!/usr/bin/env node
/**
 * Fresh-clone bootstrap helpers used by root `npm run setup`.
 * Safe to re-run; does not overwrite existing env files.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function copyIfMissing(exampleRel, targetRel) {
  const example = path.join(root, exampleRel);
  const target = path.join(root, targetRel);
  if (!fs.existsSync(example)) {
    console.warn(`[bootstrap] skip missing example: ${exampleRel}`);
    return;
  }
  if (fs.existsSync(target)) {
    console.log(`[bootstrap] keep existing ${targetRel}`);
    return;
  }
  fs.copyFileSync(example, target);
  console.log(`[bootstrap] created ${targetRel} from example`);
}

copyIfMissing(
  'apps/api/.env.development.example',
  'apps/api/.env.development',
);

const ensure = path.join(root, 'apps/mobile/scripts/ensure-mobile-node-modules.js');
if (fs.existsSync(ensure)) {
  spawnSync(process.execPath, [ensure], { stdio: 'inherit' });
}

console.log(`
[bootstrap] Done.

Next (demo / mock mode — no Mongo required):
  npm run dev          # Metro bundler
  npm run android      # or: npm run ios

iOS first clone also needs:
  cd apps/mobile/ios && pod install && cd -

Optional API (needs local MongoDB):
  npm run dev:api
  npm run seed --workspace apps/api
`);
