export function phraseMatch(a: number[], b: number[]) {
  const set = new Set(b);
  return a.some(p => set.has(p + 1));
}

