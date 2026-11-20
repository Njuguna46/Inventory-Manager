import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEMES = [
  { id: 'light', name: 'Light', icon: '☀️' },
  { id: 'dark', name: 'Dark', icon: '🌙' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'forest', name: 'Forest', icon: '🌲' },
  { id: 'sunset', name: 'Sunset', icon: '🌅' },
  { id: 'minimal', name: 'Minimal', icon: '⚪' },
];

const STORAGE_KEY = 'inventory-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && THEMES.some(t => t.id === stored)) {
        return stored;
      }
    }
    return 'light';
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const changeTheme = useCallback((newTheme) => {
    if (THEMES.some(t => t.id === newTheme)) {
      setTheme(newTheme);
    }
  }, []);

  const value = {
    theme,
    themes: THEMES,
    changeTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}