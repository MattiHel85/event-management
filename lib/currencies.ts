export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar",          symbol: "$",   flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar",    symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar",  symbol: "A$",  flag: "🇦🇺" },
  { code: "GBP", name: "British Pound",      symbol: "£",   flag: "🇬🇧" },
  { code: "EUR", name: "Euro",               symbol: "€",   flag: "🇪🇺" },
  { code: "SEK", name: "Swedish Krona",      symbol: "kr",  flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone",    symbol: "kr",  flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone",       symbol: "kr",  flag: "🇩🇰" },
  { code: "ISK", name: "Icelandic Króna",    symbol: "kr",  flag: "🇮🇸" },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatAmount(amount: number, currencyCode: string): string {
  const { symbol, code } = getCurrency(currencyCode);
  const formatted = amount.toLocaleString("en-US");
  // Suffix symbol for Scandinavian convention; prefix for all others
  const suffix = ["SEK", "NOK", "DKK", "ISK"].includes(code);
  return suffix ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}
