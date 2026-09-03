import { useState, useEffect } from 'react';
import { StoreSettings } from '../types/index.js';
import { settingsApi } from '../api/index.js';

export const STORE_SYNC_EVENT = 'craft_store_sync';
const SETTINGS_CACHE_KEY = 'craft_store_settings_cache';

export function triggerStoreSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_SYNC_EVENT));
  }
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name_ar: 'كرافت',
  store_name_en: 'CRAFT',
  currency: 'EGP',
  whatsapp_number: '+201234567890',
  announcement_bar_enabled: 'false',
  announcement_text_ar: '',
  announcement_text_en: '',
  announcement_link: '/shop',
  announcement_coupon: '',
};

function getInitialSettings(): StoreSettings {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // ignore JSON errors
    }
  }
  return { ...DEFAULT_SETTINGS };
}

let listeners: (() => void)[] = [];
let settings: StoreSettings = getInitialSettings();
let isLoaded = false;
let fetchPromise: Promise<void> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

export async function reloadSettings() {
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const data = await settingsApi.getPublic();
      if (data && typeof data === 'object') {
        settings = { ...settings, ...data };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
          } catch {}
        }
      }
      isLoaded = true;
      notify();
    } catch {
      isLoaded = true;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

if (typeof window !== 'undefined') {
  window.addEventListener(STORE_SYNC_EVENT, () => {
    reloadSettings();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_CACHE_KEY) {
      settings = getInitialSettings();
      notify();
    }
  });
}

export function useStoreSettings() {
  const [, setTrigger] = useState(0);

  useEffect(() => {
    const listener = () => setTrigger((t) => t + 1);
    listeners.push(listener);

    if (!isLoaded) {
      reloadSettings();
    }

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    settings,
    isLoaded,
    reloadSettings,
  };
}
