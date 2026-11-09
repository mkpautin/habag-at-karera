import 'server-only';
import sharp from 'sharp';

sharp.cache({ memory: 16 });
sharp.concurrency(1);
const images = new Map<string, Promise<Buffer>>();

export async function imageResponse(filename: string) {
  // Only call after authorizing the group's access to its current challenge.
  let pending = images.get(filename);
  if (!pending) {
    pending = sharp(filename)
      .rotate()
      .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    images.set(filename, pending);
    pending.catch(() => { images.delete(filename); });
  }
  const bytes = await pending;
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store' } });
}
