import { Language, TextDirection, Currency } from '../enums/index.js';
import { LanguageConfig } from '../types/index.js';

export const SUPPORTED_LANGUAGES: Record<Language, LanguageConfig> = {
  [Language.AR]: {
    code: Language.AR,
    direction: TextDirection.RTL,
    label: 'العربية',
  },
  [Language.EN]: {
    code: Language.EN,
    direction: TextDirection.LTR,
    label: 'English',
  },
};

export const DEFAULT_LANGUAGE = Language.AR;

export const SUPPORTED_CURRENCIES: Currency[] = [
  Currency.EGP,
  Currency.USD,
  Currency.SAR,
  Currency.AED,
];

export const DEFAULT_CURRENCY = Currency.EGP;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
