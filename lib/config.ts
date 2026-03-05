/**
 * Настройки магазина: валюта и формат цен.
 * Валюта задаётся через .env: NEXT_PUBLIC_CURRENCY_SYMBOL (например ₽, €, $)
 */

const CURRENCY_SYMBOL =
  typeof process.env.NEXT_PUBLIC_CURRENCY_SYMBOL === 'string' &&
  process.env.NEXT_PUBLIC_CURRENCY_SYMBOL.trim() !== ''
    ? process.env.NEXT_PUBLIC_CURRENCY_SYMBOL.trim()
    : '₸';

export const currencySymbol = CURRENCY_SYMBOL;

/** Форматирует цену с символом валюты (например: 1 299 ₽ или $99) */
export function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${CURRENCY_SYMBOL}${formatted}`;
}
