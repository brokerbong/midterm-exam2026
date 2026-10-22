import { sampling, attention, lora, tfidf } from './math.js';

const $ = selector => document.querySelector(selector);
const cards = [...document.querySelectorAll('.searchable')];
const sections = [...document.querySelectorAll('main section')];
const questions = [...document.querySelectorAll('.quiz-card')];
const menu = $('.subject-menu');
const mobile = matchMedia('(max-width:900px)');
let quizType = '전체';
function syncMenu() { menu.open = !mobile.matches; }
syncMenu(); mobile.addEventListener('change', syncMenu);

function filter() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  for (const card of cards) {
    const matchesType = !card.classList.contains('quiz-card') || quizType === '전체' || card.dataset.type === quizType;
    card.hidden = !card.textContent.toLocaleLowerCase().includes(query) || !matchesType;
  }
  for (const section of sections) {
    // Keep the quiz controls reachable even when a chosen category has no matches.
    section.hidden = section.id === 'quiz' ? false : !section.querySelector('.searchable:not([hidden])');
  }
  const visible = cards.filter(card => !card.hidden).length;
  $('#count').textContent = query || quizType !== '전체' ? `${visible}개 항목` : '전체 보기';
  $('#empty').hidden = visible > 0;
  const count = questions.filter(card => !card.hidden).length;
  $('#quiz-count').textContent = `${count} / ${questions.length}문항`;
  $('#quiz-empty').hidden = count > 0;
  document.querySelectorAll('[data-quiz-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.quizType === quizType)));
}
$('#search').addEventListener('input', filter);
$('#reset').addEventListener('click', () => { $('#search').value = ''; quizType = '전체'; filter(); $('#search').focus(); });
document.querySelectorAll('[data-quiz-type]').forEach(button => button.addEventListener('click', () => { quizType = button.dataset.quizType; filter(); }));
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
  $('#search').value = ''; quizType = '전체'; filter(); if (mobile.matches) menu.open = false;
}));
$('#answers-open').addEventListener('click', () => document.querySelectorAll('.answer').forEach(d => d.open = true));
$('#answers-close').addEventListener('click', () => document.querySelectorAll('.answer').forEach(d => d.open = false));

let printState;
window.addEventListener('beforeprint', () => {
  if (printState) return;
  printState = {
    answers: [...document.querySelectorAll('.answer')].map(d => [d, d.open]),
    hidden: [...cards, ...sections].map(el => [el, el.hidden])
  };
  printState.answers.forEach(([d]) => d.open = true);
  printState.hidden.forEach(([el]) => el.hidden = false);
});
window.addEventListener('afterprint', () => {
  printState?.answers.forEach(([d, open]) => d.open = open);
  printState?.hidden.forEach(([el, hidden]) => el.hidden = hidden);
  printState = undefined;
});
$('#print').addEventListener('click', () => window.print());

function number(id) {
  const text = $(id).value.trim();
  return text === '' ? NaN : Number(text);
}
function format(value) { return value.toLocaleString('ko-KR', { maximumFractionDigits: 6 }); }
function updateSampling() {
  const mode = $('#sampling-mode').value;
  $('#top-k').disabled = mode !== 'top-k'; $('#top-p').disabled = mode !== 'top-p';
  const bars = $('#probability-bars');
  bars.replaceChildren();
  try {
    const result = sampling(number('#temperature'), mode, mode === 'top-k' ? number('#top-k') : number('#top-p'));
    result.probabilities.forEach((p, i) => {
      const row = document.createElement('div'); row.className = 'barrow' + (result.keep.includes(i) ? '' : ' excluded');
      const label = document.createElement('span'); label.textContent = 'ABCDE'[i];
      const track = document.createElement('div'); track.className = 'track';
      const fill = document.createElement('div'); fill.className = 'fill'; fill.style.width = `${p * 100}%`; track.append(fill);
      const value = document.createElement('span'); value.textContent = `${(p * 100).toFixed(2)}%`;
      row.append(label, track, value); bars.append(row);
    });
    bars.setAttribute('aria-label', '필터 전 확률: ' + result.probabilities.map((p, i) => `${'ABCDE'[i]} ${(p * 100).toFixed(2)}%${result.keep.includes(i) ? ' 유지' : ' 제외'}`).join(', '));
    $('#sampling-output').textContent = `유지 후보 ${result.keep.length}개: ${result.keep.map(i => 'ABCDE'[i]).join(', ')}. 재정규화 후: ${result.keep.map(i => `${'ABCDE'[i]} ${(result.final[i] * 100).toFixed(2)}%`).join(' · ')}. 이는 후보 선택 확률이며 사실 정확도가 아닙니다.`;
  } catch (error) {
    bars.setAttribute('aria-label', '입력 오류로 확률 막대를 표시하지 않습니다.');
    $('#sampling-output').textContent = error.message;
  }
}
function updateAttention() {
  try {
    const result = attention(number('#tokens-before'), number('#tokens-after'));
    $('#attention-output').textContent = `길이 ${format(result.lengthRatio)}배 → 점수 원소 수 ${format(result.before)}개 → ${format(result.after)}개 (${format(result.ratio)}배). Head 하나의 n × n 비교입니다.`;
  } catch { $('#attention-output').textContent = '실제 토큰 수는 각각 1–131,072 사이의 정수여야 합니다.'; }
}
function updateLora() {
  try {
    const result = lora(number('#lora-d'), number('#lora-k'), number('#lora-r'));
    $('#lora-output').textContent = `기본 W: ${format(result.base)}개 (고정). 학습 A/B: r × (d + k) = ${format(result.adapter)}개, W 파라미터 수의 ${format(result.percent)}%. 기본 W는 별도로 보관합니다.`;
  } catch { $('#lora-output').textContent = 'd·k는 1–65,536 사이 정수, rank는 1 이상이며 min(d, k) 이하여야 합니다.'; }
}
function updateTfidf() {
  try {
    const result = tfidf(number('#tfidf-n'), number('#tfidf-df'), number('#tfidf-tf'));
    $('#tfidf-output').textContent = `IDF = ln(N / df) = ${format(result.idf)}. TF-IDF = TF × IDF = ${format(result.weight)}. N과 TF가 같을 때 df가 커지면 이 가중치는 증가하지 않습니다.`;
  } catch { $('#tfidf-output').textContent = 'N은 1–1,000,000, df는 1–N, TF는 0–1,000,000 사이의 정수여야 합니다.'; }
}
for (const [ids, update] of [
  [['temperature', 'sampling-mode', 'top-k', 'top-p'], updateSampling],
  [['tokens-before', 'tokens-after'], updateAttention],
  [['lora-d', 'lora-k', 'lora-r'], updateLora],
  [['tfidf-n', 'tfidf-df', 'tfidf-tf'], updateTfidf]
]) {
  ids.forEach(id => $(`#${id}`).addEventListener('input', update)); update();
}
try { localStorage.setItem('exam:lastSubject', 'natural-language-processing'); } catch {}
