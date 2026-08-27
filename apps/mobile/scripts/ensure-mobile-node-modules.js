#!/usr/bin/env node
/**
 * npm workspaces hoist react-native to the repo root, but RN Android/iOS
 * tooling expects packages under apps/mobile/node_modules. Restore symlinks.
 */
const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileRoot, '../..');
const mobileNm = path.join(mobileRoot, 'node_modules');
const rootNm = path.join(repoRoot, 'node_modules');

const links = [
  ['react-native', 'react-native'],
  ['@react-native/gradle-plugin', '@react-native/gradle-plugin'],
  ['@react-native/codegen', '@react-native/codegen'],
  ['@react-native/community-cli-plugin', '@react-native/community-cli-plugin'],
  ['react-native-razorpay', 'react-native-razorpay'],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function linkOne(relTarget, relLink) {
  const target = path.join(rootNm, relTarget);
  const linkPath = path.join(mobileNm, relLink);

  if (!fs.existsSync(target)) {
    console.warn(`[ensure-mobile-node-modules] skip missing: ${relTarget}`);
    return;
  }

  ensureDir(path.dirname(linkPath));

  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() || stat.isDirectory() || stat.isFile()) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    // nothing to remove
  }

  const relative = path.relative(path.dirname(linkPath), target);
  fs.symlinkSync(relative, linkPath);
  console.log(`[ensure-mobile-node-modules] linked ${relLink} -> ${relative}`);
}

ensureDir(mobileNm);
for (const [target, link] of links) {
  linkOne(target, link);
}
