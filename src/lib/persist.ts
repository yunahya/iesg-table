import { type OnChangeFn, type Updater, functionalUpdate } from '@tanstack/react-table';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface PersistOptions {
  /**
   * Bump this when the shape of the stored value changes. Old entries are
   * ignored rather than fed to a component that can no longer read them.
   */
  version?: number;
  /** Defaults to `localStorage`. Pass `sessionStorage` for per-tab state. */
  storage?: Storage;
}

function getStorage(explicit?: Storage): Storage | null {
  if (explicit) return explicit;
  // Server rendering, and browsers with site data blocked, both land here.
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(storage: Storage | null, key: string, version: number): T | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as { v: number; value: T };
    return parsed.v === version ? parsed.value : undefined;
  } catch {
    // Corrupt or hand-edited entry — fall back to the initial value.
    return undefined;
  }
}

/**
 * Table state that survives a reload, shaped to drop straight into `DataTable`:
 *
 *   const [order, setOrder] = usePersistedState<ColumnOrderState>('emissions.columnOrder', []);
 *   <DataTable columnOrder={order} onColumnOrderChange={setOrder} />
 *
 * Works for any of the controlled props — column order, sizing, visibility,
 * pinning, sorting. Persistence is deliberately opt-in: the table never writes
 * to storage on its own, so nothing is stored behind a user's back and the key
 * naming stays yours.
 */
export function usePersistedState<T>(key: string, initial: T, options: PersistOptions = {}): [T, OnChangeFn<T>] {
  const { version = 1, storage } = options;
  const store = getStorage(storage);

  // Read once, lazily: reading on every render would be a synchronous
  // localStorage hit per keystroke.
  const [value, setValue] = useState<T>(() => read<T>(store, key, version) ?? initial);

  // A changed key means a different table; re-read rather than carrying state over.
  const previousKey = useRef(key);
  useEffect(() => {
    if (previousKey.current === key) return;
    previousKey.current = key;
    setValue(read<T>(store, key, version) ?? initial);
  }, [key, store, version, initial]);

  const setAndStore = useCallback<OnChangeFn<T>>(
    (updater: Updater<T>) => {
      setValue((previous) => {
        const next = functionalUpdate(updater, previous);
        try {
          store?.setItem(key, JSON.stringify({ v: version, value: next }));
        } catch {
          // Quota exceeded or private mode — keep working, just unpersisted.
        }
        return next;
      });
    },
    [store, key, version],
  );

  return [value, setAndStore];
}

/** Forgets a persisted entry. Use it behind a "reset layout" control. */
export function clearPersistedState(key: string, storage?: Storage): void {
  try {
    getStorage(storage)?.removeItem(key);
  } catch {
    // Nothing to do — the entry is unreachable either way.
  }
}
