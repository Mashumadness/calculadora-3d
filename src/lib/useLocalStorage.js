import { useEffect, useState } from 'react';

/** Estado persistido en localStorage, con fallback silencioso si falla. */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage lleno o bloqueado: seguimos en memoria */
    }
  }, [key, value]);

  return [value, setValue];
}
