import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types/index.ts';

const STORAGE_KEY = 'swyftpain-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme: Theme = prefersDark ? 'dark' : 'light';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
    } catch {
      // Fallback if localStorage or matchMedia fails
      setThemeState('light');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage write error
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    mounted,
    setTheme,
    toggleTheme,
  };
}
