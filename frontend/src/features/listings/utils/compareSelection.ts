// Compare is always a two-horse race: keep the selection capped at two,
// dropping the oldest pick when a third arrives (first in, first out).
export const MAX_COMPARE = 2;

export function toggleSelection(current: Set<string>, id: string) {
  const next = new Set(current);

  if (next.has(id)) {
    next.delete(id);
    return next;
  }

  if (next.size >= MAX_COMPARE) {
    // Sets iterate in insertion order, this drops the oldest pick.
    const [oldest] = next;
    next.delete(oldest);
  }

  next.add(id);

  return next;
}