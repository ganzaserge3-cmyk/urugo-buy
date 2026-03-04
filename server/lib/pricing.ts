export type CouponInput = {
  discountType: string;
  value: number;
};

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeCouponDiscount(subtotal: number, coupon: CouponInput): number {
  const raw = coupon.discountType === "percent"
    ? subtotal * (coupon.value / 100)
    : coupon.value;
  return Math.min(roundCurrency(raw), subtotal);
}
