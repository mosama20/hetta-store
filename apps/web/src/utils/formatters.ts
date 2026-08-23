export function formatPrice(amount: number, currency = 'EGP', isArabic = false): string {
  const formatted = new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return isArabic ? `${formatted} ج.م` : `${currency} ${formatted}`;
}

export function formatDate(dateString: string, isArabic = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getLocalized(
  ar: string | undefined | null,
  en: string | undefined | null,
  isArabic: boolean,
): string {
  if (isArabic) {
    return ar || en || '';
  }
  return en || ar || '';
}
