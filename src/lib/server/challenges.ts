import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { provinces } from '@/lib/provinces';

// Fill these before competition. Answers remain server-side.
export const anagrams: { scrambled: string; answer: string; hint: string }[] = [];
export const places: { image: string; provinceId: string; hint: string }[] = [];
export const imageIds = ['p7x2', 'r4n9', 't8q3', 'v2m6', 'z5k1'] as const;
export const sequenceOrders = [[imageIds[2], imageIds[0], imageIds[4], imageIds[1], imageIds[3]], [imageIds[3], imageIds[1], imageIds[0], imageIds[4], imageIds[2]]] as const;
export const sourceNumberById = Object.fromEntries(imageIds.map((id, index) => [id, index + 1]));
export const assetPath = (...parts: string[]) => path.join(process.cwd(), 'private-assets', ...parts);
export const sequenceFile = (round: number, id: string) => assetPath('station-2', `round-${round}`, `${sourceNumberById[id]}.jpg`);

export function contentReady(station: number) {
  if (station === 1) return anagrams.length === 3 && anagrams.every(x => x.scrambled && x.answer && x.hint);
  if (station === 2) return [1, 2].every(round => imageIds.every(id => existsSync(sequenceFile(round, id))));
  return places.length === 5 && places.every(x => /^[a-zA-Z0-9_.-]+$/.test(x.image) && provinces.some(p => p.id === x.provinceId) && x.hint && existsSync(assetPath('station-3', x.image)));
}
