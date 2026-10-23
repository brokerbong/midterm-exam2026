import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sampleQuestions, matchesQuestion} from './public/subjects/open-source-software/practice.js';

test('OSS photo-based bank has 150 distinct answered questions and valid anchors', async () => {
  const html = await readFile(new URL('./public/subjects/open-source-software/index.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  const cards = [...html.matchAll(/<article id="q-(\d+)"[^>]*data-chapter="(\d)"[^>]*>(.*?)<\/article>/gs)];
  assert.equal(cards.length, 150);
  assert.deepEqual([1,2,3,4,5,6].map(i => cards.filter(c => +c[2] === i).length), [15,35,30,25,25,20]);
  const prompts = cards.map(c => c[3].match(/<h3>\d+\. (.*?)<\/h3>/s)[1]);
  assert.equal(new Set(prompts).size, 150);
  cards.forEach(c => {
    assert.match(c[3], /<details class="answer"><summary>정답·해설 보기<\/summary><p>[^<]+<\/p>/);
    assert.doesNotMatch(c[3], /오류|에러|재설치|방화벽|접속 복구|비밀번호/);
  });
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  assert.doesNotMatch(html, /C:[\\/]|KakaoTalk_|ntn_|<img|file:\/\//);
});

test('practice selection combines conditions and samples unique questions without altering bank', () => {
  const bank = Array.from({length:150}, (_,i) => ({id:i, chapter:i<35?'2':'3', type:i%2?'명령 작성':'결과 예측',text:i<35?'cp 파일 복사':'vi 저장'}));
  const eligible = bank.filter(q => matchesQuestion(q, {query:' CP ',chapter:'2',type:'명령 작성'}));
  assert.equal(eligible.length,17);
  const small = sampleQuestions(eligible,25,()=>0.5);
  assert.equal(small.length,17);
  assert.equal(new Set(small).size,17);
  assert.ok(small.every(q => eligible.includes(q)));
  assert.equal(sampleQuestions([],25).length,0);
  const before = [...bank];
  const sample = sampleQuestions(bank,25,()=>0.2);
  assert.equal(sample.length,25);
  assert.equal(new Set(sample).size,25);
  assert.deepEqual(bank,before);
  assert.equal(matchesQuestion(bank[0],{chapter:'6'}),false);
});
