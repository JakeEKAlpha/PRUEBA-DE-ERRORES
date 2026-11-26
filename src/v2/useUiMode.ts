import { useEffect, useState } from 'react';

export type UiVersionMode = 'v2' | 'v1';

const STORAGE_KEY = 'lexmark_ui_mode';

export function useUiMode(initial: UiVersionMode = 'v2') {
  const [uiMode, setUiMode] = useState<UiVersionMode>(() => {
    if (typeof window === 'undefined') return initial;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'v1' || saved === 'v2' ? saved : initial;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, uiMode);
    }
  }, [uiMode]);

  return { uiMode, setUiMode };
}
