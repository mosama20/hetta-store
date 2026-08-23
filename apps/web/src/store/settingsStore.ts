import { useState, useEffect } from 'react';
import { StoreSettings } from '../types/index.js';
import { settingsApi } from '../api/index.js';

export const STORE_SYNC_EVENT = 'craft_store_sync';

export function triggerStoreSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_SYNC_EVENT));
  }
}

let listeners: (() => void)[] = [];
let settings: StoreSettings = {
  store_name_ar: 'متجري',
  store_name_en: 'My Store',
  currency: 'EGP',
  whatsapp_number: '',
  announcement_bar_enabled: 'false',
  announcement_text_ar: '',
  announcement_text_en: '',
  announcement_link: '/shop',
  announcement_coupon: '',
};
let isLoaded = false;

function notify() {
  listeners.forEach((l) => l());
}

export async function reloadSettings() {
  try {
    const data = await settingsApi.getPublic();
    settings = { ...settings, ...data };
    isLoaded = true;
    notify();
  } catch {
    isLoaded = true;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(STORE_SYNC_EVENT, () => {
    reloadSettings();
  });
  window.addEventListener('storage', () => {
    reloadSettings();
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
