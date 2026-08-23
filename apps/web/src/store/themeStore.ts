import { useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

const LANG_KEY = 'fs_lang';
const THEME_KEY = 'fs_theme';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'ar';
  const saved = localStorage.getItem(LANG_KEY);
  return saved === 'en' || saved === 'ar' ? saved : 'ar';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

let listeners: (() => void)[] = [];
let currentLang: Language = getInitialLanguage();
let currentTheme: Theme = getInitialTheme();

function applyDomSettings() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('lang', currentLang);
  root.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

  if (currentTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Apply immediately on load
applyDomSettings();

function notify() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_KEY, currentLang);
    localStorage.setItem(THEME_KEY, currentTheme);
    applyDomSettings();
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const [, setTrigger] = useState(0);

  useEffect(() => {
    const listener = () => setTrigger((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    currentLang = lang;
    notify();
  };

  const toggleLanguage = () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    notify();
  };

  const setTheme = (theme: Theme) => {
    currentTheme = theme;
    notify();
  };

  const toggleTheme = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    notify();
  };

  return {
    language: currentLang,
    isArabic: currentLang === 'ar',
    isRtl: currentLang === 'ar',
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    setLanguage,
    toggleLanguage,
    setTheme,
    toggleTheme,
  };
}
