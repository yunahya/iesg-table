import { type OnChangeFn, type Updater, functionalUpdate } from '@tanstack/react-table';
import { useCallback, useState } from 'react';

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
  const value = isControlled ? controlled : internal;

  const handleChange = useCallback<OnChangeFn<T>>(
    (updater: Updater<T>) => {
      if (!isControlled) setInternal((previous) => functionalUpdate(updater, previous));
      onChange?.(updater);
    },
    [isControlled, onChange],
  );

  return [value, handleChange];
}
