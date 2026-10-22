const $ = selector => document.querySelector(selector);
const cards = [...document.querySelectorAll('.searchable')];
const sections = [...document.querySelectorAll('main section')];
const menu = $('.subject-menu');
const mobile = matchMedia('(max-width:900px)');
function syncMenu() { menu.open = !mobile.matches; }
syncMenu(); mobile.addEventListener('change', syncMenu);
function filter() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  for (const card of cards) card.hidden = !card.textContent.toLocaleLowerCase().includes(query);
  for (const section of sections) section.hidden = !section.querySelector('.searchable:not([hidden])');
  const visible = cards.filter(card => !card.hidden).length;
  $('#count').textContent = query ? `${visible}개 항목` : '전체 보기';
  $('#empty').hidden = visible > 0;
}
$('#search').addEventListener('input', filter);
$('#reset').addEventListener('click', () => { $('#search').value=''; filter(); $('#search').focus(); });
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
  $('#search').value=''; filter(); if(mobile.matches) menu.open=false;
}));
$('#answers-open').addEventListener('click', () => document.querySelectorAll('.answer').forEach(d => d.open=true));
$('#answers-close').addEventListener('click', () => document.querySelectorAll('.answer').forEach(d => d.open=false));
let printState;
window.addEventListener('beforeprint', () => {
  printState=[...document.querySelectorAll('.answer')].map(d=>[d,d.open]);
  printState.forEach(([d])=>d.open=true);
});
window.addEventListener('afterprint', () => printState?.forEach(([d,open])=>d.open=open));
$('#print').addEventListener('click', () => window.print());
function integer(id, min=1) {
  const raw=$(id).value.trim(); const value=Number(raw);
  return raw!=='' && Number.isInteger(value) && value>=min && value<=8192 ? value : null;
}
function patch() {
  const h=integer('#image-size'), p=integer('#patch-size');
  const output=$('#patch-output'), grid=$('#patch-grid');
  if(h===null || p===null || h%p!==0) {
    output.textContent='1–8192의 정수를 입력하세요. Padding 없이 나누므로 이미지 한 변이 패치 한 변으로 나누어떨어져야 합니다.'; grid.hidden=true; return;
  }
  const side=h/p, n=side*side, tokens=n+1;
  output.textContent=`${h} ÷ ${p} = ${side} → ${side} × ${side} = ${n.toLocaleString()}개 패치 → CLS 포함 ${tokens.toLocaleString()}개 토큰. Attention 행렬: ${tokens} × ${tokens} = ${(tokens*tokens).toLocaleString()}개 원소 (Head당).`;
  grid.hidden=false; grid.style.backgroundSize=`${100/Math.min(side,32)}% ${100/Math.min(side,32)}%`;
}
function conv() {
  const n=integer('#conv-n'), k=integer('#conv-k'), p=integer('#conv-p',0), s=integer('#conv-s');
  const output=$('#conv-output');
  if([n,k,p,s].includes(null) || n+2*p<k) {
    output.textContent='N·K·S는 1–8192, P는 0–8192의 정수여야 하며 N+2P가 K 이상이어야 합니다.';return;
  }
  const value=Math.floor((n+2*p-k)/s)+1;
  output.textContent=`floor((${n} + 2×${p} − ${k}) ÷ ${s}) + 1 = ${value}. 출력 공간 크기: ${value} × ${value}. 출력 채널은 필터 수로 결정됩니다.`;
}
['#image-size','#patch-size'].forEach(id=>$(id).addEventListener('input',patch));
['#conv-n','#conv-k','#conv-p','#conv-s'].forEach(id=>$(id).addEventListener('input',conv));
patch();conv();
try { localStorage.setItem('exam:lastSubject','computer-vision'); } catch {}
