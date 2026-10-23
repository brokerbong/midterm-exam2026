// Fisher–Yates sampling without replacement; the caller owns the input array.
export function sampleQuestions(items, limit = 25, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, limit);
}

export function matchesQuestion(item, {query = '', chapter = 'all', type = 'all'} = {}) {
  return (chapter === 'all' || item.chapter === chapter)
    && (type === 'all' || item.type === type)
    && item.text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
