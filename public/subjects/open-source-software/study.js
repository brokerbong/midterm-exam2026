import {sampleQuestions, matchesQuestion} from './practice.js';
const $ = selector => document.querySelector(selector);
const cards = [...document.querySelectorAll('.searchable')];
const questions = [...document.querySelectorAll('.quiz-card')];
const sections = [...document.querySelectorAll('main section')];
const mobile = matchMedia('(max-width:900px)');
const menu = $('.subject-menu');
const syncMenu = () => { menu.open = !mobile.matches; };
syncMenu(); mobile.addEventListener('change', syncMenu);
let selected = null;
function criteria() { return {query: $('#search').value, chapter: $('#chapter').value, type: $('#type').value}; }
function eligible(card) {
  return matchesQuestion({text: card.textContent, chapter: card.dataset.chapter, type: card.dataset.type}, criteria());
}
function filter() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  for (const card of cards) {
    card.hidden = card.classList.contains('quiz-card')
      ? !eligible(card) || (selected !== null && !selected.has(card.id))
      : !card.textContent.toLocaleLowerCase().includes(query);
  }
  for (const section of sections) section.hidden = section.id !== 'quiz' && !section.querySelector('.searchable:not([hidden])');
  const visible = cards.filter(c => !c.hidden).length;
  const count = questions.filter(c => !c.hidden).length;
  $('#count').textContent = `${visible}개 학습 항목 표시`;
  $('#quiz-count').textContent = `${count} / ${questions.length}문항${selected ? ' · 무작위 복습' : ''}`;
  $('#empty').hidden = visible > 0;
  $('#quiz-empty').hidden = count > 0;
}
for (const [id, event] of [['search','input'],['chapter','change'],['type','change']]) {
  $(`#${id}`).addEventListener(event, () => { selected = null; filter(); });
}
function reset() {
  $('#search').value = ''; $('#chapter').value = 'all'; $('#type').value = 'all'; selected = null; filter();
}
$('#reset').addEventListener('click', reset);
$('#sample').addEventListener('click', () => {
  selected = new Set(sampleQuestions(questions.filter(eligible)).map(card => card.id));
  questions.forEach(c => c.querySelector('.answer').open = false);
  filter();
});
$('#all-questions').addEventListener('click', () => { selected = null; filter(); });
$('#answers-open').addEventListener('click', () => questions.filter(c => !c.hidden).forEach(c => c.querySelector('.answer').open = true));
$('#answers-close').addEventListener('click', () => questions.forEach(c => c.querySelector('.answer').open = false));
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => { reset(); if (mobile.matches) menu.open = false; }));
let printState;
window.addEventListener('beforeprint', () => {
  if (printState) return;
  printState = {hidden: [...cards,...sections].map(el => [el, el.hidden]), answers: questions.map(c => { const d = c.querySelector('.answer'); return [d,d.open]; })};
  printState.hidden.forEach(([el]) => el.hidden = false);
  printState.answers.forEach(([d]) => d.open = true);
});
window.addEventListener('afterprint', () => {
  printState?.hidden.forEach(([el,hidden]) => el.hidden = hidden);
  printState?.answers.forEach(([d,open]) => d.open = open);
  printState = undefined;
});
$('#print').addEventListener('click', () => window.print());
try { localStorage.setItem('exam:lastSubject', 'open-source-software'); } catch { /* Storage may be disabled. */ }
filter();
