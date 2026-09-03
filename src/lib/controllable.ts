import { type OnChangeFn, type Updater, functionalUpdate } from '@tanstack/react-table';
import { useCallback, useRef, useState } from 'react';
import { shallowEqual } from './shallow-equal';

/**
 * Holds on to the previous reference while the value is unchanged in substance.
 * A caller writing `columnPinning={{ left: [], right: [] }}` inline hands us a
 * new object every render; TanStack compares row-model dependencies by
 * identity, so passing that straight through would invalidate its caches on
 * every render — and some of those caches reset state when they recompute.
 */
function useStableIdentity<T>(value: T): T {
  const held = useRef(value);
  if (!shallowEqual(held.current, value)) held.current = value;
  return held.current;
}

/**
 * Bridges TanStack's updater-style callbacks to a prop that may or may not be
 * controlled. When `controlled` is undefined the state lives here; when it is
 * provided the caller owns it and only gets notified.
 */
export function useControllable<T>(
  controlled: T | undefined,
  initial: T,
  onChange: OnChangeFn<T> | undefined,
): [T, OnChangeFn<T>] {
  const [internal, setInternal] = useState<T>(initial);
  const isControlled = controlled !== undefined;
  const stable = useStableIdentity(controlled);
  const value = isControlled ? (stable as T) : internal;

  const handleChange = useCallback<OnChangeFn<T>>(
    (updater: Updater<T>) => {
      if (!isControlled) setInternal((previous) => functionalUpdate(updater, previous));
      onChange?.(updater);
    },
    [isControlled, onChange],
  );

  return [value, handleChange];
}
