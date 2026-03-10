import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useCheckoutQuote, useCreateOrder } from "@/hooks/use-checkout";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useAuth } from "@/hooks/use-auth";

export default function Checkout() {
  useSeo("Checkout - UrugoBuy", "Secure checkout with delivery slot, coupon support, and payment options.", { canonicalPath: "/checkout", robots: "noindex,follow" });
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart, setIsOpen } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { user } = useAuth();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    city: "",
    country: "USA",
    couponCode: "",
    giftCardCode: "",
    deliverySlot: "",
    fulfillmentType: "delivery" as "delivery" | "pickup",
    paymentMethod: "cod" as "card" | "paypal" | "momo" | "cod",
  });
  const [deliverySlots, setDeliverySlots] = useState<string[]>([]);
  const [deliverySlotOptions, setDeliverySlotOptions] = useState<Array<{
    id: string;
    label: string;
    remaining: number;
    available: boolean;
    isPickup?: boolean;
  }>>([]);
  const [couponMessage, setCouponMessage] = useState<string>("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [riskMessage, setRiskMessage] = useState("");
  const [regionalTax, setRegionalTax] = useState<number | null>(null);
  const [regionalTaxRate, setRegionalTaxRate] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState<Array<{ code: string; rateFromUsd: string; symbol: string }>>([]);
  const [locale, setLocale] = useState("en");
  const checkoutStorageKey = "checkout-draft";
  const [showPromoFields, setShowPromoFields] = useState(false);

  const quoteItems = items.map((item) => ({ productId: item.id, quantity: item.quantity }));
  const hasItems = quoteItems.length > 0;
  const { data: quote, isLoading: isQuoteLoading } = useCheckoutQuote(
    {
      items: quoteItems,
      couponCode: form.couponCode || undefined,
      giftCardCode: form.giftCardCode || undefined,
      country: form.country || undefined,
    },
    hasItems,
  );

  const labelsByLocale: Record<string, { checkout: string; placeOrder: string; shippingAddress: string }> = {
    en: { checkout: "Checkout", placeOrder: "Place Order", shippingAddress: "Shipping address" },
    fr: { checkout: "Paiement", placeOrder: "Passer la commande", shippingAddress: "Adresse de livraison" },
    ar: { checkout: "الدفع", placeOrder: "تأكيد الطلب", shippingAddress: "عنوان الشحن" },
  };
  const labels = labelsByLocale[locale] || labelsByLocale.en;
  const quickPaymentOptions = [
    {
      id: "cod" as const,
      title: "Pay on delivery",
      subtitle: "The easiest option. Place your order now and pay cash when it arrives.",
      icon: Wallet,
    },
  ];
  const primaryButtonLabel = "Place Cash on Delivery Order";
  const selectedRate = useMemo(
    () => rates.find((row) => row.code === currency),
    [currency, rates],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(checkoutStorageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<typeof form>;
      setForm((prev) => ({ ...prev, ...draft }));
    } catch {
      localStorage.removeItem(checkoutStorageKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(checkoutStorageKey, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name,
      customerEmail: prev.customerEmail || user.email,
    }));
  }, [user]);

  useEffect(() => {
    fetch("/api/delivery-slots")
      .then((r) => r.json())
      .then((slots) => {
        if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === "object") {
          const typed = slots as Array<{ id: string; label: string; remaining: number; available: boolean; isPickup?: boolean }>;
          setDeliverySlotOptions(typed);
          setDeliverySlots(typed.map((slot) => slot.label));
          const firstAvailable = typed.find((slot) => slot.available)?.label || typed[0].label;
          setForm((prev) => ({ ...prev, deliverySlot: prev.deliverySlot || firstAvailable }));
          return;
        }
        setDeliverySlots(Array.isArray(slots) ? slots : []);
        setDeliverySlotOptions([]);
        if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === "string") {
          setForm((prev) => ({ ...prev, deliverySlot: prev.deliverySlot || slots[0] }));
        }
      })
      .catch(() => setDeliverySlots([]));
  }, []);

  useEffect(() => {
    fetch("/api/currency/rates")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setRates(Array.isArray(rows) ? rows : []))
      .catch(() => setRates([]));
  }, []);

  useEffect(() => {
    const query = form.shippingAddress.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/address/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((rows) => setAddressSuggestions(Array.isArray(rows) ? rows : []))
        .catch(() => setAddressSuggestions([]));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.shippingAddress]);

  useEffect(() => {
    if (!form.couponCode.trim() || !quote) {
      setCouponMessage("");
      return;
    }
    if (quote.discount > 0) {
      setCouponMessage(`Coupon applied: -$${quote.discount.toFixed(2)}`);
    } else {
      setCouponMessage("Coupon is not valid for current cart.");
    }
  }, [form.couponCode, quote]);

  useEffect(() => {
    const subtotal = quote?.subtotal ?? totalPrice();
    if (!subtotal || !form.country) return;
    fetch(`/api/tax/estimate?country=${encodeURIComponent(form.country)}&subtotal=${subtotal}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return;
        setRegionalTax(Number(payload.tax || 0));
        setRegionalTaxRate(Number(payload.rate || 0));
      })
      .catch(() => {
        setRegionalTax(null);
        setRegionalTaxRate(null);
      });
  }, [form.country, quote?.subtotal, totalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems) {
      toast({ variant: "destructive", title: "Cart is empty", description: "Add products before checkout." });
      return;
    }

    try {
      if (quote) {
        const riskRes = await fetch("/api/checkout/risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerEmail: form.customerEmail, amount: quote.total }),
        });
        if (riskRes.ok) {
          const risk = await riskRes.json();
          if (risk.level === "high") {
            setRiskMessage("High-risk checkout detected. Please contact support.");
            return;
          }
          setRiskMessage(risk.level === "medium" ? "Medium-risk order. Additional verification may be required." : "");
        }
      }

      const order = await createOrder.mutateAsync({
        ...form,
        couponCode: form.couponCode || undefined,
        giftCardCode: form.giftCardCode || undefined,
        deliverySlot: form.deliverySlot || undefined,
        items: quoteItems,
      });

      sessionStorage.setItem(
        "checkout-payment-note",
        JSON.stringify({
          orderId: order.id,
          message: "Your order was placed successfully. Please keep cash ready for delivery.",
        }),
      );

      clearCart();
      setIsOpen(false);
      localStorage.removeItem(checkoutStorageKey);
      setLocation(`/order-success/${order.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order";
      toast({ variant: "destructive", title: "Checkout failed", description: message });
    }
  };

  if (!hasItems) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center border rounded-2xl p-10 bg-muted/20">
          <h1 className="font-display text-4xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add products to continue to checkout.</p>
          <Button asChild className="rounded-full">
            <Link href="/shop">Go to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 border border-border rounded-2xl p-6 md:p-8 space-y-5 bg-card">
            <h1 className="font-display text-3xl font-bold">{labels.checkout}</h1>
            <p className="text-muted-foreground">A short checkout with the fewest steps needed to pay and confirm your order.</p>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Fast checkout</p>
                  <p className="text-sm text-muted-foreground">Contact, address, payment, done.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-background px-3 py-1">Secure payment</span>
                  <span className="rounded-full bg-background px-3 py-1">Saved draft</span>
                  <span className="rounded-full bg-background px-3 py-1">Live stock check</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              Prices are shown in {currency}. You can finish checkout without changing extra settings.
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">1. Contact</h2>
                <p className="text-sm text-muted-foreground">Where we send order updates and delivery details.</p>
              </div>
            <Input
              placeholder="Full name"
              value={form.customerName}
              onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="Email address"
              value={form.customerEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
              required
            />
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">2. Delivery</h2>
                <p className="text-sm text-muted-foreground">Choose where and how you want to receive the order.</p>
              </div>
            <Input
              placeholder={labels.shippingAddress}
              value={form.shippingAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
              required
            />
            {addressSuggestions.length > 0 && (
              <div className="rounded-lg border border-border p-2 bg-muted/20 text-sm space-y-1">
                {addressSuggestions
                  .slice(0, 3)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="block w-full text-left hover:text-primary"
                      onClick={() => setForm((prev) => ({ ...prev, shippingAddress: suggestion }))}
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              required
            />
            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              required
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.deliverySlot}
              onChange={(e) => setForm((prev) => ({ ...prev, deliverySlot: e.target.value }))}
            >
              {deliverySlots.map((slot) => {
                const meta = deliverySlotOptions.find((row) => row.label === slot);
                return (
                  <option key={slot} value={slot} disabled={meta ? !meta.available : false}>
                    {slot}{meta ? ` (${meta.remaining} left)` : ""}
                  </option>
                );
              })}
            </select>
            {deliverySlotOptions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Slots update live by remaining capacity.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={form.fulfillmentType === "delivery" ? "default" : "outline"}
                onClick={() => {
                  const nextSlot = deliverySlotOptions.find((slot) => !slot.isPickup && slot.available)?.label || form.deliverySlot;
                  setForm((prev) => ({ ...prev, fulfillmentType: "delivery", deliverySlot: nextSlot }));
                }}
                className="rounded-full"
              >
                Home Delivery
              </Button>
              <Button
                type="button"
                variant={form.fulfillmentType === "pickup" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, fulfillmentType: "pickup", deliverySlot: "Store Pickup - Ready in 2 hours" }))}
                className="rounded-full"
              >
                Click & Collect
              </Button>
            </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">3. Payment</h2>
                <p className="text-sm text-muted-foreground">Pick the easiest way to complete this order.</p>
              </div>
              <div className="grid gap-3">
                {quickPaymentOptions.map((option) => {
                  const Icon = option.icon;
                  const active = form.paymentMethod === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: option.id }))}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 rounded-full p-2 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{option.title}</p>
                              {option.id === "cod" && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                          </div>
                        </div>
                        {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowPromoFields((prev) => !prev)}
                className="text-sm font-medium text-primary"
              >
                {showPromoFields ? "Hide coupon and gift card" : "Have a coupon or gift card?"}
              </button>
              {showPromoFields && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Coupon code"
                    value={form.couponCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  />
                  <Input
                    placeholder="Gift card code"
                    value={form.giftCardCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, giftCardCode: e.target.value.toUpperCase() }))}
                  />
                </div>
              )}
            </div>
            {couponMessage && <p className="text-sm text-muted-foreground">{couponMessage}</p>}
            {riskMessage && <p className="text-sm text-amber-600">{riskMessage}</p>}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
              Cash on delivery is active. You place the order now and pay when the delivery arrives.
            </div>
            <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Secure checkout with encryption, fraud checks, and protected payment processing.
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full h-12" disabled={createOrder.isPending || isQuoteLoading}>
              {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
              {createOrder.isPending ? "Processing..." : primaryButtonLabel}
            </Button>
          </form>

          <aside className="border border-border rounded-2xl p-6 h-fit bg-muted/20">
            <h2 className="font-display text-2xl font-semibold mb-5">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="pr-3">
                    <p className="font-medium line-clamp-1">{item.name}</p>
                    <p className="text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p>${(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${quote?.subtotal.toFixed(2) ?? totalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${quote?.shippingFee.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${(regionalTax ?? quote?.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-${quote?.discount?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gift Card</span>
                <span>-${quote?.giftCardDiscount?.toFixed(2) ?? "0.00"}</span>
              </div>
              {regionalTaxRate !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Rate</span>
                  <span>{(regionalTaxRate * 100).toFixed(1)}%</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                <span>Total</span>
                <span>
                  {(() => {
                    const baseTotal = quote?.total ?? totalPrice();
                    const converted = selectedRate ? baseTotal * Number(selectedRate.rateFromUsd) : baseTotal;
                    const symbol = selectedRate?.symbol ?? "$";
                    return `${symbol}${converted.toFixed(2)}`;
                  })()}
                </span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-background/80 p-4">
              <h3 className="font-medium mb-2">Checkout confidence</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Encrypted checkout and server-side order validation</li>
                <li>Live stock and delivery slot checks before order placement</li>
                <li>Draft details are saved locally if you leave checkout</li>
                <li>You will pay when the order arrives.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
