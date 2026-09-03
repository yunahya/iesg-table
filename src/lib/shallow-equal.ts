/**
 * Structural comparison, bounded to a couple of levels.
 *
 * Used to keep a controlled prop's identity stable. Callers write
 * `grouping={on ? ['scope'] : []}` or `columnPinning={{ left: [], right: [] }}`
 * inline — a fresh value every render — and TanStack compares its row-model
 * dependencies with `Object.is`. Without this the models recompute on every
 * render, and the grouped model resets the expanded state whenever it does,
 * so an expanded row would collapse the instant anything re-rendered.
 *
 * Two levels covers every shape the table's state actually has (`{ left: [],
 * right: [] }`, `[{ id, value }]`). The depth cap keeps the cost bounded no
 * matter what a caller puts in a filter value.
 */
export function shallowEqual(a: unknown, b: unknown, depth = 2): boolean {
  if (Object.is(a, b)) return true;
  if (depth <= 0) return false;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;

  return keys.every((key) => shallowEqual(left[key], right[key], depth - 1));
}
