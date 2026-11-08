import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { provinces } from '@/lib/provinces';
import { roundCounts } from '@/lib/game-rules';

export const anagrams = [
  { scrambled: 'YANHAYNA', answer: 'HAYNAYAN', hint: 'BIOLOGY' },
  { scrambled: 'GINSAD', answer: 'DAGSIN', hint: 'GRAVITY' },
  { scrambled: 'YANKILAN', answer: 'LIKNAYAN', hint: 'PHYSICS' },
  { scrambled: 'GANAWNGA', answer: 'AWANGGAN', hint: 'INFINITY' },
  { scrambled: 'BANTUMAS', answer: 'TUMBASAN', hint: 'EQUATION' },
];

function provinceId(name: string) {
  const province = provinces.find(item => item.name === name);
  if (!province) throw new Error(`Unknown province in challenge configuration: ${name}`);
  return province.id;
}

export const places = [
  { image: '1.jpg', provinceIds: [provinceId('Ifugao')], hint: 'Cordillera Administrative Region' },
  { image: '2.jpg', provinceIds: [provinceId('Metro Manila (NCR)')], hint: 'Polytechnic UP' },
  { image: '3.jpeg', provinceIds: [provinceId('Lanao del Sur')], hint: 'BARMM' },
  { image: '4.jpg', provinceIds: [provinceId('Leyte'), provinceId('Samar')], hint: 'Eastern Visayas' },
  { image: '5.jpg', provinceIds: [provinceId('Ilocos Sur')], hint: 'Region I' },
];
export const imageIds = ['p7x2', 'r4n9', 't8q3', 'v2m6', 'z5k1'] as const;
export const sequenceOrders = [[imageIds[2], imageIds[0], imageIds[4], imageIds[1], imageIds[3]], [imageIds[3], imageIds[1], imageIds[0], imageIds[4], imageIds[2]]] as const;
export const sourceNumberById = Object.fromEntries(imageIds.map((id, index) => [id, index + 1]));
export const assetPath = (...parts: string[]) => path.join(process.cwd(), 'private-assets', ...parts);
export function sequenceFile(round: number, id: string) {
  const number = sourceNumberById[id];
  if (number === undefined) throw new Error('Unknown sequence image identifier.');
  return ['jpg', 'jpeg', 'png'].map(extension => path.join(process.cwd(), 'private-assets', 'station-2', `round-${round}`, `${number}.${extension}`)).find(existsSync);
}

export function imageContentType(filename: string) {
  return filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

const normalizeAnswer = (answer: string) => answer.normalize('NFC').trim().toLocaleLowerCase('fil');

export function isCorrectGuess(station: 1 | 3, round: number, answer: string) {
  if (station === 1) {
    const challenge = anagrams[round - 1];
    return challenge !== undefined && normalizeAnswer(answer) === normalizeAnswer(challenge.answer);
  }
  return places[round - 1]?.provinceIds.includes(answer) ?? false;
}

export function contentReady(station: number) {
  if (station === 1) return anagrams.length === roundCounts[1] && anagrams.every(x => x.scrambled && x.answer && x.hint);
  if (station === 2) return [1, 2].every(round => imageIds.every(id => sequenceFile(round, id) !== undefined));
  if (station === 3) return places.length === roundCounts[3] && places.every(x => /^[a-zA-Z0-9_.-]+$/.test(x.image) && x.provinceIds.length > 0 && x.provinceIds.every(id => provinces.some(p => p.id === id)) && x.hint && existsSync(assetPath('station-3', x.image)));
  return false;
}
