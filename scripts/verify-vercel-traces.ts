import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';

function assets(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = join(directory, entry.name);
    return entry.isDirectory() ? assets(filename) : /\.(jpe?g|png)$/.test(entry.name) ? [resolve(filename)] : [];
  });
}

const expected = assets('private-assets');
assert.equal(expected.length, 15, 'Expected all 15 station images.');
const traceSchema = z.object({ files: z.array(z.string()) });
for (const route of ['game/state', 'assets/sequence', 'assets/place']) {
  const tracePath = `.next/server/app/api/${route}/route.js.nft.json`;
  const trace = traceSchema.parse(JSON.parse(readFileSync(tracePath, 'utf8')));
  const files = new Set(trace.files.map(file => resolve(dirname(tracePath), file)));
  for (const filename of expected) assert.ok(files.has(filename), `${route} is missing a private station asset.`);
  for (const filename of files) {
    if (filename.startsWith(resolve('.env')) && filename !== resolve('.env.example')) throw new Error(`${route} traced a local environment file.`);
  }
  console.log(`Verified ${route}: all ${expected.length} private station assets are included.`);
}
