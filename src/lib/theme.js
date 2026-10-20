import { useEffect, useState } from 'react';

export const THEMES = [
  { id: 'light', label: 'สว่าง', emoji: '☀️' },
  { id: 'dark', label: 'มืด', emoji: '🌙' },
  { id: 'halloween', label: 'ฮาโลวีน', emoji: '🎃' },
];

const STORAGE_KEY = 'badbeaow-theme';
const CHANGE_EVENT = 'badbeaow-theme-change';

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some(theme => theme.id === value)) return value;
  } catch { /* storage unavailable */ }
  return 'light';
}

export function applyTheme(theme) {
  if (theme === 'light') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);
  useEffect(() => {
    const handleChange = event => setThemeState(event.detail);
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);
  return [theme, setTheme];
}
