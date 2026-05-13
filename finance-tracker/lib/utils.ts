import { format, isToday, isYesterday } from 'date-fns';
import { colors } from '@/theme/colors';
import type { TransactionType } from './types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

export function formatAmount(n: number): string {
  const abs = Math.abs(n);
  const [int, dec] = abs.toFixed(2).split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intFormatted}.${dec}`;
}

export function formatCurrency(amount: number, currency = 'THB'): string {
  return `${currencySymbol(currency)}${formatAmount(amount)}`;
}

export function formatTransactionDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatSectionDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

export function amountColor(type: TransactionType): string {
  if (type === 'income') return colors.accent;
  if (type === 'expense') return colors.danger;
  return colors.textMuted;
}

export function amountPrefix(type: TransactionType): string {
  if (type === 'income') return '+';
  if (type === 'expense') return '-';
  return '';
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
