// Pure calculations shared by the browser and the numerical regression tests.
export const BASE_PROBABILITIES = [0.45, 0.30, 0.15, 0.07, 0.03];

function integer(value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError('정수 입력 범위를 확인하세요.');
}

export function sampling(temperature, mode = 'none', limit) {
  if (!Number.isFinite(temperature) || temperature < 0.1 || temperature > 5) throw new RangeError('Temperature는 0.1–5 사이여야 합니다.');
  if (!['none', 'top-k', 'top-p'].includes(mode)) throw new RangeError('후보 제한 방식을 확인하세요.');
  const logits = BASE_PROBABILITIES.map(p => Math.log(p) / temperature);
  const max = Math.max(...logits);
  const exp = logits.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  const probabilities = exp.map(v => v / sum);
  const order = probabilities.map((_, i) => i).sort((a, b) => probabilities[b] - probabilities[a]);
  let keep = order;
  if (mode === 'top-k') {
    integer(limit, 1, probabilities.length);
    keep = order.slice(0, limit);
  }
  if (mode === 'top-p') {
    if (!Number.isFinite(limit) || limit < 0.01 || limit > 1) throw new RangeError('Top-p는 0.01–1 사이여야 합니다.');
    keep = [];
    let cumulative = 0;
    for (const i of order) {
      keep.push(i);
      cumulative += probabilities[i];
      // Account for roundoff at an exact cumulative boundary, e.g. 0.45 + 0.30.
      if (cumulative + Number.EPSILON * 8 >= limit) break;
    }
  }
  const keptMass = keep.reduce((a, i) => a + probabilities[i], 0);
  return { probabilities, keep, final: probabilities.map((p, i) => keep.includes(i) ? p / keptMass : 0) };
}

export function attention(before, after) {
  integer(before, 1, 131072); integer(after, 1, 131072);
  return { before: before ** 2, after: after ** 2, lengthRatio: after / before, ratio: (after / before) ** 2 };
}

export function lora(d, k, rank) {
  integer(d, 1, 65536); integer(k, 1, 65536); integer(rank, 1, Math.min(d, k));
  const base = d * k, adapter = rank * (d + k);
  return { base, adapter, percent: adapter / base * 100 };
}

export function tfidf(n, df, tf) {
  integer(n, 1, 1000000); integer(df, 1, n); integer(tf, 0, 1000000);
  const idf = Math.log(n / df);
  return { idf, weight: tf * idf };
}
