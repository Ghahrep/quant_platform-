// src/utils/formatting/formatting.ts
interface FormatCurrencyOptions {
  compact?: boolean;
  currency?: string;
  locale?: string;
}

interface FormatPercentOptions {
  decimals?: number;
  showSign?: boolean;
}

export const formatCurrency = (
  value: number, 
  options: FormatCurrencyOptions = {}
): string => {
  const { 
    compact = false, 
    currency = 'USD', 
    locale = 'en-US' 
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  });

  return formatter.format(value);
};

export const formatPercent = (
  value: number, 
  options: FormatPercentOptions = {}
): string => {
  const { 
    decimals = 1, 
    showSign = false 
  } = options;

  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
};

export const formatNumber = (
  value: number, 
  options: { decimals?: number; compact?: boolean } = {}
): string => {
  const { decimals = 0, compact = false } = options;

  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
  }).format(value);
};