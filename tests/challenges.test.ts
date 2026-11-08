import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { roundCounts, totalRounds } from '../src/lib/game-rules';
import { provinces } from '../src/lib/provinces';
import { anagrams, assetPath, contentReady, imageContentType, imageIds, isCorrectGuess, places, sequenceFile, sequenceOrders } from '../src/lib/server/challenges';

test('all five anagrams accept mixed case and surrounding whitespace', () => {
  const answers = ['HAYNAYAN', 'DAGSIN', 'LIKNAYAN', 'AWANGGAN', 'TUMBASAN'];
  for (const [index, answer] of answers.entries()) {
    assert.equal(isCorrectGuess(1, index + 1, answer), true);
    assert.equal(isCorrectGuess(1, index + 1, `  ${answer.toLowerCase()}  `), true);
    assert.equal(isCorrectGuess(1, index + 1, `${answer[0]}${answer.slice(1).toLowerCase()}`), true);
    assert.equal(isCorrectGuess(1, index + 1, 'maling sagot'), false);
  }
  assert.equal(isCorrectGuess(1, 6, ''), false);
});

test('place answers accept canonical selections, including either Leyte or Samar', () => {
  const id = (name: string) => {
    const province = provinces.find(item => item.name === name);
    assert.ok(province);
    return province.id;
  };
  for (const [round, province] of [[1, 'Ifugao'], [2, 'Metro Manila (NCR)'], [3, 'Lanao del Sur'], [4, 'Leyte'], [4, 'Samar'], [5, 'Ilocos Sur']] as const) {
    assert.equal(isCorrectGuess(3, round, id(province)), true);
  }
  assert.equal(isCorrectGuess(3, 4, id('Eastern Samar')), false);
  assert.equal(isCorrectGuess(3, 4, 'Leyte'), false);
  assert.equal(isCorrectGuess(3, 1, id('Ilocos Sur')), false);
});

test('all stations have their configured rounds and assets', () => {
  assert.equal(anagrams.length, roundCounts[1]);
  assert.equal(sequenceOrders.length, roundCounts[2]);
  assert.equal(places.length, roundCounts[3]);
  assert.equal(totalRounds, 12);
  for (const station of [1, 2, 3]) assert.equal(contentReady(station), true, `Station ${station} must be ready`);
});

test('sequence shuffles retain all images and file resolution supports PNG and JPEG', () => {
  for (const [index, order] of sequenceOrders.entries()) {
    assert.deepEqual([...order].sort(), [...imageIds].sort());
    assert.notDeepEqual(order, imageIds);
    for (const id of order) {
      const filename = sequenceFile(index + 1, id);
      assert.ok(filename);
      const bytes = readFileSync(filename);
      assert.ok(bytes.length > 0);
      if (imageContentType(filename) === 'image/png') assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      else assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
    }
  }
  const png = sequenceFile(2, imageIds[1]);
  assert.ok(png);
  assert.ok(png.endsWith('2.png'));
  assert.equal(imageContentType(png), 'image/png');
  assert.equal(imageContentType(places[2].image), 'image/jpeg');
  for (const place of places) assert.equal(readFileSync(assetPath('station-3', place.image)).subarray(0, 3).toString('hex'), 'ffd8ff');
});
