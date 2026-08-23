import { Language, TextDirection } from '../enums/index.js';

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface LanguageConfig {
  code: Language;
  direction: TextDirection;
  label: string;
}
