const list = document.querySelector('#subjects');
const search = document.querySelector('#subject-search');
function filter() {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  for (const card of list.querySelectorAll('.subject-card')) {
    card.hidden = !card.textContent.toLocaleLowerCase().includes(query);
    if (!card.hidden) visible++;
  }
  document.querySelector('#empty').hidden = visible !== 0;
}
search.addEventListener('input', filter);
fetch('/subjects.json').then(response => {
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
}).then(subjects => {
  const fragment = document.createDocumentFragment();
  for (const subject of subjects) {
    const card = document.createElement('a'); card.className = 'subject-card'; card.href = subject.href;
    for (const [tag, cls, text] of [['span','subject-symbol',subject.id.slice(0,1).toUpperCase()],['div','subject-meta',subject.subtitle],['h3','',subject.title],['p','',subject.description]]) {
      const el = document.createElement(tag); el.className = cls; el.textContent = text; card.append(el);
    }
    const tags = document.createElement('div'); tags.className = 'tags';
    for (const text of subject.tags || []) { const el=document.createElement('span');el.textContent=text;tags.append(el); }
    card.append(tags);
    const bottom=document.createElement('div');bottom.className='card-bottom';bottom.textContent='학습 시작 ↗';card.append(bottom);fragment.append(card);
  }
  list.replaceChildren(fragment); document.querySelector('#total').textContent=subjects.length; filter();
  try {
    const last=subjects.find(s=>s.id===localStorage.getItem('exam:lastSubject'));
    if(last){const a=document.querySelector('#resume');a.href=last.href;a.textContent='이어서 보기 · '+last.title+' →';a.hidden=false;}
  } catch {}
}).catch(() => { /* The initial Unity card remains available without the catalog. */ });
