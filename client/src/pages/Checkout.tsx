import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useCheckoutQuote, useCreateOrder } from "@/hooks/use-checkout";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

export default function Checkout() {
  useSeo("Checkout - UrugoBuy", "Secure checkout with delivery slot, coupon support, and payment options.");
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart, setIsOpen } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    city: "",
    country: "USA",
    couponCode: "",
    deliverySlot: "",
    fulfillmentType: "delivery" as "delivery" | "pickup",
    paymentMethod: "card" as "card" | "paypal" | "momo" | "cod",
  });
  const [deliverySlots, setDeliverySlots] = useState<string[]>([]);
  const [couponMessage, setCouponMessage] = useState<string>("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [riskMessage, setRiskMessage] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState<Array<{ code: string; rateFromUsd: string; symbol: string }>>([]);
  const [locale, setLocale] = useState("en");

  const quoteItems = items.map((item) => ({ productId: item.id, quantity: item.quantity }));
  const hasItems = quoteItems.length > 0;
  const { data: quote, isLoading: isQuoteLoading } = useCheckoutQuote(
    { items: quoteItems, couponCode: form.couponCode || undefined },
    hasItems,
  );

  useEffect(() => {
    fetch("/api/delivery-slots")
      .then((r) => r.json())
      .then((slots) => {
        setDeliverySlots(Array.isArray(slots) ? slots : []);
        if (Array.isArray(slots) && slots.length > 0) {
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
        deliverySlot: form.deliverySlot || undefined,
        items: quoteItems,
      });

      if (form.paymentMethod === "card" && quote) {
        const paymentRes = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: quote.total, orderId: order.id }),
        });
        if (!paymentRes.ok) {
          throw new Error("Payment initialization failed");
        }
      }

      clearCart();
      setIsOpen(false);
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
            <h1 className="font-display text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">Enter shipping details to place your order.</p>
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {rates.map((rate) => (
                  <option key={rate.code} value={rate.code}>{rate.code}</option>
                ))}
                {rates.length === 0 && <option value="USD">USD</option>}
              </select>
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
            <Input
              placeholder="Shipping address"
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
            <Input
              placeholder="Coupon code (optional)"
              value={form.couponCode}
              onChange={(e) => setForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.deliverySlot}
              onChange={(e) => setForm((prev) => ({ ...prev, deliverySlot: e.target.value }))}
            >
              {deliverySlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={form.fulfillmentType === "delivery" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, fulfillmentType: "delivery" }))}
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={form.paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "card" }))}
                className="rounded-full"
              >
                Pay by Card
              </Button>
              <Button
                type="button"
                variant={form.paymentMethod === "paypal" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "paypal" }))}
                className="rounded-full"
              >
                PayPal
              </Button>
              <Button
                type="button"
                variant={form.paymentMethod === "momo" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "momo" }))}
                className="rounded-full"
              >
                MoMo
              </Button>
              <Button
                type="button"
                variant={form.paymentMethod === "cod" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "cod" }))}
                className="rounded-full"
              >
                Cash on Delivery
              </Button>
            </div>
            {couponMessage && <p className="text-sm text-muted-foreground">{couponMessage}</p>}
            {riskMessage && <p className="text-sm text-amber-600">{riskMessage}</p>}
            <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Secure checkout with encryption, fraud checks, and protected payment processing.
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full h-12" disabled={createOrder.isPending || isQuoteLoading}>
              {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {createOrder.isPending ? "Placing Order..." : "Place Order"}
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
                <span>${quote?.tax.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-${quote?.discount?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                <span>Total</span>
                <span>
                  {(() => {
                    const baseTotal = quote?.total ?? totalPrice();
                    const selectedRate = rates.find((row) => row.code === currency);
                    const converted = selectedRate ? baseTotal * Number(selectedRate.rateFromUsd) : baseTotal;
                    const symbol = selectedRate?.symbol ?? "$";
                    return `${symbol}${converted.toFixed(2)}`;
                  })()}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
