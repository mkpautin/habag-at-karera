import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { assetPath, imageIds, places, sequenceFile } from '../src/lib/server/challenges';
import { imageResponse } from '../src/lib/server/images';

test('all private station images fit Vercel responses after optimization', async () => {
  const files = [
    ...[1, 2].flatMap(round => imageIds.map(id => {
      const file = sequenceFile(round, id);
      assert.ok(file);
      return file;
    })),
    ...places.map(place => assetPath('station-3', place.image)),
  ];
  assert.equal(files.length, 15);
  for (const file of files) {
    const response = await imageResponse(file);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 0 && bytes.length < 4_000_000, 'Image must remain below Vercel buffered-response limits.');
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'webp');
    assert.ok(metadata.width && metadata.width <= 1600);
    assert.ok(metadata.height && metadata.height <= 1200);
  }
});
