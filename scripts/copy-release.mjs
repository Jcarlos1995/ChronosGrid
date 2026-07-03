/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copies the build artifacts that the desktop auto-updater and the web
 * download button need from release/ into public/download/:
 *   - the NSIS installer (.exe)
 *   - its .blockmap (used for differential updates)
 *   - latest.yml (the update manifest electron-updater polls)
 *
 * Run automatically at the end of `npm run electron:release`.
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = join(root, 'release');
const targetDir = join(root, 'public', 'download');

if (!existsSync(releaseDir)) {
  console.error('[copy-release] release/ not found. Run the build first.');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const wanted = readdirSync(releaseDir).filter(
  (f) => f.endsWith('.exe') || f.endsWith('.exe.blockmap') || f === 'latest.yml'
);

if (wanted.length === 0) {
  console.error('[copy-release] No installer/manifest artifacts found in release/.');
  process.exit(1);
}

for (const file of wanted) {
  copyFileSync(join(releaseDir, file), join(targetDir, file));
  console.log(`[copy-release] copied ${file} -> public/download/`);
}

console.log('[copy-release] Done. Deploy public/ (or dist/ after build) so the app can find updates.');
