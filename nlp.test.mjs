import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sampling, attention, lora, tfidf, BASE_PROBABILITIES } from './public/subjects/natural-language-processing/math.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('sampling matches lecture examples and exact nucleus boundaries', () => {
  sampling(1).probabilities.forEach((p, i) => close(p, BASE_PROBABILITIES[i]));
  const k = sampling(1, 'top-k', 2);
  assert.deepEqual(k.keep, [0, 1]); close(k.final[0], 0.6); close(k.final[1], 0.4);
  const p = sampling(1, 'top-p', 0.8);
  assert.deepEqual(p.keep, [0, 1, 2]); close(p.final[0], 0.5);
  assert.deepEqual(sampling(1, 'top-p', 0.75).keep, [0, 1]);
  assert.deepEqual(sampling(1, 'top-p', 1).keep, [0, 1, 2, 3, 4]);
  assert.deepEqual(sampling(1, 'top-p', 0.01).keep, [0]);
});
test('temperature changes concentration without changing the top token; output is normalized', () => {
  assert.ok(sampling(0.3).probabilities[0] > sampling(1.2).probabilities[0]);
  for (const t of [0.1, 0.3, 1, 2, 5]) {
    const r = sampling(t, 'top-p', 0.8);
    close(r.final.reduce((a, b) => a + b), 1);
    assert.equal(r.keep[0], 0);
    assert.ok(r.probabilities.every(Number.isFinite));
  }
});
test('calculators reproduce worked examples and boundary cases', () => {
  assert.equal(attention(1024, 2048).ratio, 4);
  assert.equal(attention(512, 1536).after, 2359296);
  assert.equal(lora(4096, 4096, 8).adapter, 65536);
  assert.equal(lora(4096, 4096, 16).adapter, 131072);
  close(lora(4096, 4096, 8).percent, 0.390625);
  close(tfidf(100, 10, 3).weight, 6.907755278982138);
  assert.equal(tfidf(100, 100, 3).weight, 0);
  assert.equal(tfidf(100, 10, 0).weight, 0);
});
test('invalid calculator inputs are rejected rather than producing NaN or impossible counts', () => {
  for (const fn of [() => sampling(0), () => sampling(NaN), () => sampling(1, 'bad'),
    () => sampling(1, 'top-k', 2.5), () => sampling(1, 'top-k', 6), () => sampling(1, 'top-p', 0),
    () => attention(0, 1), () => attention(1.5, 2), () => lora(8, 8, 9), () => lora(1, NaN, 1),
    () => tfidf(10, 11, 1), () => tfidf(10, 0, 1), () => tfidf(10, 1, -1)]) assert.throws(fn, RangeError);
});
test('NLP page has complete questions, valid internal anchors and no local PDF exposure', async () => {
  const html = await readFile(new URL('./public/subjects/natural-language-processing/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/class="card searchable quiz-card"/g) || []).length, 42);
  assert.equal((html.match(/class="answer"/g) || []).length, 42);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing anchor: ${id}`);
  assert.doesNotMatch(html, /C:[/\\]|file:\/\/|href="[^"]*\.pdf"/i);
});
