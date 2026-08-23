export enum OrderStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STORE_MANAGER = 'STORE_MANAGER',
  SALES_AGENT = 'SALES_AGENT',
}

export enum Language {
  AR = 'ar',
  EN = 'en',
}

export enum TextDirection {
  RTL = 'rtl',
  LTR = 'ltr',
}

export enum Currency {
  EGP = 'EGP',
  USD = 'USD',
  SAR = 'SAR',
  AED = 'AED',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
