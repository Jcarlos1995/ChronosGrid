/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyConfig } from './types';

export const currencies: CurrencyConfig[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', rateToEUR: 1.0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToEUR: 0.92 },
  { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', rateToEUR: 0.25 },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', rateToEUR: 0.091 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToEUR: 1.17 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToEUR: 0.0058 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToEUR: 0.68 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToEUR: 0.61 },
];

export function formatCurrency(amount: number, currencyCode: string): string {
  const config = currencies.find(c => c.code === currencyCode) || currencies[0];
  
  // Custom display formats for currency symbols
  if (config.code === 'PEN') {
    return `${config.symbol} ${amount.toFixed(2)}`;
  }
  if (config.code === 'MAD') {
    return `${amount.toFixed(2)} ${config.symbol}`;
  }
  return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
