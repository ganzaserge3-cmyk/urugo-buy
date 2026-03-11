type OrderCurrencySnapshot = {
  currencyCode?: string | null;
  exchangeRate?: string | number | null;
  marketCountry?: string | null;
};

const currencyLocales: Record<string, string> = {
  USD: "en-US",
  EUR: "fr-FR",
  AED: "ar-AE",
  GBP: "en-GB",
  CAD: "en-CA",
  RWF: "en-RW",
};

const marketLocales: Record<string, string> = {
  US: "en-US",
  FR: "fr-FR",
  AE: "ar-AE",
  GB: "en-GB",
  CA: "en-CA",
  RW: "en-RW",
};

export function formatOrderMoney(
  amountUsd: number | string,
  snapshot: OrderCurrencySnapshot | null | undefined,
  fallbackFormat: (value: number) => string,
) {
  const amount = Number(amountUsd) || 0;
  const currencyCode = snapshot?.currencyCode?.trim().toUpperCase();
  const rate = Number(snapshot?.exchangeRate);

  if (!currencyCode || !Number.isFinite(rate) || rate <= 0) {
    return fallbackFormat(amount);
  }

  const convertedAmount = currencyCode === "USD" ? amount : amount * rate;
  const locale = marketLocales[snapshot?.marketCountry?.trim().toUpperCase() || ""] || currencyLocales[currencyCode] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "RWF" ? 0 : 2,
  }).format(convertedAmount);
}
