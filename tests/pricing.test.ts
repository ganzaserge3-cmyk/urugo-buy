import test from "node:test";
import assert from "node:assert/strict";
import { computeCouponDiscount, roundCurrency } from "../server/lib/pricing";

test("computeCouponDiscount supports percent coupon", () => {
  const discount = computeCouponDiscount(100, { discountType: "percent", value: 10 });
  assert.equal(discount, 10);
});

test("computeCouponDiscount supports fixed coupon", () => {
  const discount = computeCouponDiscount(100, { discountType: "fixed", value: 5 });
  assert.equal(discount, 5);
});

test("computeCouponDiscount does not exceed subtotal", () => {
  const discount = computeCouponDiscount(8, { discountType: "fixed", value: 20 });
  assert.equal(discount, 8);
});

test("roundCurrency keeps two decimals", () => {
  assert.equal(roundCurrency(10.236), 10.24);
});
