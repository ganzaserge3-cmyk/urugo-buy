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
import { useI18n } from "@/lib/i18n";

export default function Checkout() {
  const { market, t, formatCurrency } = useI18n();
  useSeo(t("checkout.metaTitle"), t("checkout.metaDescription"), { canonicalPath: "/checkout", robots: "noindex,follow" });
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
    country: t(`checkout.country.${market.code}`),
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

  const quickPaymentOptions = [
    {
      id: "cod" as const,
      title: t("checkout.payOnDelivery"),
      subtitle: t("checkout.payOnDeliveryBody"),
      icon: Wallet,
    },
  ];
  const primaryButtonLabel = t("checkout.placeCodOrder");

  useEffect(() => {
    setForm((prev) => {
      const nextCountry = t(`checkout.country.${market.code}`);
      if (prev.country === nextCountry) return prev;
      return { ...prev, country: nextCountry };
    });
  }, [market.code, t]);

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
      setCouponMessage(t("checkout.couponApplied", { amount: formatCurrency(quote.discount) }));
    } else {
      setCouponMessage(t("checkout.couponInvalid"));
    }
  }, [form.couponCode, formatCurrency, quote, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems) {
      toast({ variant: "destructive", title: t("checkout.cartEmpty"), description: t("checkout.cartEmptyBody") });
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
            setRiskMessage(t("checkout.riskHigh"));
            return;
          }
          setRiskMessage(risk.level === "medium" ? t("checkout.riskMedium") : "");
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
          message: t("checkout.orderPlacedNote"),
        }),
      );

      clearCart();
      setIsOpen(false);
      localStorage.removeItem(checkoutStorageKey);
      setLocation(`/order-success/${order.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order";
      toast({ variant: "destructive", title: t("checkout.failed"), description: message });
    }
  };

  if (!hasItems) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center border rounded-2xl p-10 bg-muted/20">
          <h1 className="font-display text-4xl font-bold mb-3">{t("checkout.emptyTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("checkout.emptyBody")}</p>
          <Button asChild className="rounded-full">
            <Link href="/shop">{t("checkout.goToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("checkout.continueShopping")}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 border border-border rounded-2xl p-6 md:p-8 space-y-5 bg-card">
            <h1 className="font-display text-3xl font-bold">{t("checkout.title")}</h1>
            <p className="text-muted-foreground">{t("checkout.subtitle")}</p>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{t("checkout.fastTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("checkout.fastBody")}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-background px-3 py-1">{t("checkout.badgeSecure")}</span>
                  <span className="rounded-full bg-background px-3 py-1">{t("checkout.badgeDraft")}</span>
                  <span className="rounded-full bg-background px-3 py-1">{t("checkout.badgeStock")}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              {t("checkout.currencyNotice", { currency: quote?.market.currencyCode || market.currency })}
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {t(`checkout.marketDisclaimer.${market.code}`)}
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">{t("checkout.contactTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.contactBody")}</p>
              </div>
            <Input
              placeholder={t("checkout.fullName")}
              value={form.customerName}
              onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder={t("checkout.email")}
              value={form.customerEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
              required
            />
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">{t("checkout.deliveryTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.deliveryBody")}</p>
              </div>
            <Input
              placeholder={t("checkout.addressHint." + market.code)}
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
              placeholder={t("checkout.city")}
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              required
            />
            <Input
              placeholder={t("checkout.country")}
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
                {t("checkout.slotHelp")}
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
                {t("checkout.homeDelivery")}
              </Button>
              <Button
                type="button"
                variant={form.fulfillmentType === "pickup" ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, fulfillmentType: "pickup", deliverySlot: "Store Pickup - Ready in 2 hours" }))}
                className="rounded-full"
              >
                {t("checkout.clickCollect")}
              </Button>
            </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">{t("checkout.paymentTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.paymentBody")}</p>
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
                                  {t("checkout.recommended")}
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
                {showPromoFields ? t("checkout.hidePromo") : t("checkout.showPromo")}
              </button>
              {showPromoFields && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t("checkout.couponCode")}
                    value={form.couponCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  />
                  <Input
                    placeholder={t("checkout.giftCardCode")}
                    value={form.giftCardCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, giftCardCode: e.target.value.toUpperCase() }))}
                  />
                </div>
              )}
            </div>
            {couponMessage && <p className="text-sm text-muted-foreground">{couponMessage}</p>}
            {riskMessage && <p className="text-sm text-amber-600">{riskMessage}</p>}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
              {t("checkout.codActive")}
            </div>
            <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              {t("checkout.secureLine")}
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full h-12" disabled={createOrder.isPending || isQuoteLoading}>
              {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
              {createOrder.isPending ? t("checkout.processing") : primaryButtonLabel}
            </Button>
          </form>

          <aside className="border border-border rounded-2xl p-6 h-fit bg-muted/20">
            <h2 className="font-display text-2xl font-semibold mb-5">{t("checkout.summary")}</h2>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="pr-3">
                    <p className="font-medium line-clamp-1">{item.name}</p>
                    <p className="text-muted-foreground">{t("checkout.qty", { count: item.quantity })}</p>
                  </div>
                  <p>{formatCurrency(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
                <span>{formatCurrency(quote?.converted.subtotal ?? quote?.subtotal ?? totalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.shipping")}</span>
                <span>{formatCurrency(quote?.converted.shippingFee ?? quote?.shippingFee ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.tax")}</span>
                <span>{formatCurrency(quote?.converted.tax ?? quote?.tax ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.discount")}</span>
                <span>-{formatCurrency(quote?.converted.discount ?? quote?.discount ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.giftCard")}</span>
                <span>-{formatCurrency(quote?.converted.giftCardDiscount ?? quote?.giftCardDiscount ?? 0)}</span>
              </div>
              {quote?.taxRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("checkout.taxRate")}</span>
                  <span>{(quote.taxRate * 100).toFixed(1)}%</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                <span>{t("checkout.total")}</span>
                <span>{formatCurrency(quote?.converted.total ?? quote?.total ?? totalPrice())}</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-background/80 p-4">
              <h3 className="font-medium mb-2">{t("checkout.confidence")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t("checkout.confidence1")}</li>
                <li>{t("checkout.confidence2")}</li>
                <li>{t("checkout.confidence3")}</li>
                <li>{t("checkout.confidence4")}</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
