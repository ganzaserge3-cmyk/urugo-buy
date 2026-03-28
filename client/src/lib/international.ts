import type { MarketCode } from "@/lib/i18n";

type MarketGuide = {
  deliveryDays: [number, number];
  dutyRate: number;
  customsThreshold?: number;
  taxIncluded: boolean;
  clearanceLabel: "domestic" | "eu_vat" | "cross_border" | "regional";
};

const MARKET_GUIDES: Record<MarketCode, MarketGuide> = {
  US: {
    deliveryDays: [2, 4],
    dutyRate: 0,
    taxIncluded: false,
    clearanceLabel: "domestic",
  },
  FR: {
    deliveryDays: [3, 6],
    dutyRate: 0,
    customsThreshold: 150,
    taxIncluded: true,
    clearanceLabel: "eu_vat",
  },
  AE: {
    deliveryDays: [4, 8],
    dutyRate: 0.05,
    customsThreshold: 300,
    taxIncluded: false,
    clearanceLabel: "cross_border",
  },
  RW: {
    deliveryDays: [1, 3],
    dutyRate: 0.18,
    customsThreshold: 75,
    taxIncluded: false,
    clearanceLabel: "regional",
  },
};

export function getMarketGuide(code: MarketCode) {
  return MARKET_GUIDES[code];
}

export function estimateImportCharges(subtotal: number, code: MarketCode) {
  const guide = getMarketGuide(code);
  const safeSubtotal = Math.max(0, subtotal);
  const dutyEstimate = safeSubtotal * guide.dutyRate;
  const handlingEstimate = safeSubtotal > 0 && guide.clearanceLabel === "cross_border"
    ? 8
    : safeSubtotal > 0 && guide.clearanceLabel === "regional"
      ? 3
      : 0;

  return {
    dutyEstimate,
    handlingEstimate,
    landedTotalEstimate: safeSubtotal + dutyEstimate + handlingEstimate,
  };
}
