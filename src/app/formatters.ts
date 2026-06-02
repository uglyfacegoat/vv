import type { UserSettings } from "./api";

type MoneyFormatOptions = {
  compact?: boolean;
  maximumFractionDigits?: number;
};

const currencySymbols: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
};

function getLocale(numberFormat: UserSettings["number_format"]) {
  return numberFormat === "en" ? "en-US" : "ru-RU";
}

export function formatNumber(value: number, numberFormat: UserSettings["number_format"], maximumFractionDigits = 0) {
  return new Intl.NumberFormat(getLocale(numberFormat), {
    maximumFractionDigits,
  }).format(value);
}

export function formatMoney(value: number, settings: Pick<UserSettings, "number_format" | "currency">, options: MoneyFormatOptions = {}) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const symbol = currencySymbols[settings.currency] ?? settings.currency;
  const suffixes = settings.number_format === "en"
    ? { thousand: " K", million: " M" }
    : { thousand: " К", million: " М" };

  if (options.compact) {
    if (abs >= 1_000_000) {
      return `${sign}${symbol}${formatNumber(abs / 1_000_000, settings.number_format, options.maximumFractionDigits ?? 2)}${suffixes.million}`;
    }
    if (abs >= 1_000) {
      return `${sign}${symbol}${formatNumber(abs / 1_000, settings.number_format, options.maximumFractionDigits ?? 0)}${suffixes.thousand}`;
    }
  }

  return `${sign}${symbol}${formatNumber(abs, settings.number_format, options.maximumFractionDigits ?? 0)}`;
}
