/** Moves `id` so it lands immediately before or after `targetId`. */
export function moveById(order: string[], id: string, targetId: string, after: boolean): string[] {
  if (id === targetId) return order;
  const from = order.indexOf(id);
  const to = order.indexOf(targetId);
  if (from === -1 || to === -1) return order;

  const next = order.slice();
  next.splice(from, 1);
  // The removal shifts every later index down by one.
  const base = to > from ? to - 1 : to;
  next.splice(after ? base + 1 : base, 0, id);
  return next;
}

/**
 * Reorders `items` to match `order`. Ids missing from `order` keep their
 * original relative position at the end, so appended rows are never dropped.
 */
export function applyOrder<T>(items: T[], order: string[], getId: (item: T, index: number) => string): T[] {
  if (order.length === 0) return items;

  const rank = new Map(order.map((id, index) => [id, index]));
  const known: { item: T; rank: number }[] = [];
  const unknown: T[] = [];

  items.forEach((item, index) => {
    const position = rank.get(getId(item, index));
    if (position === undefined) unknown.push(item);
    else known.push({ item, rank: position });
  });

  known.sort((a, b) => a.rank - b.rank);
  return [...known.map((entry) => entry.item), ...unknown];
}

/** True when the pointer is past the vertical midpoint of the element. */
export function isAfterMidpoint(element: HTMLElement, clientY: number): boolean {
  const rect = element.getBoundingClientRect();
  return clientY > rect.top + rect.height / 2;
}

/** True when the pointer is past the horizontal midpoint of the element. */
export function isAfterMidpointX(element: HTMLElement, clientX: number): boolean {
  const rect = element.getBoundingClientRect();
  return clientX > rect.left + rect.width / 2;
}
