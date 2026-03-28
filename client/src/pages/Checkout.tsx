import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useCheckoutQuote, useCreateOrder } from "@/hooks/use-checkout";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { setOrderAccessToken } from "@/lib/order-access";
import { authFetch } from "@/lib/auth";
import { estimateImportCharges, getMarketGuide } from "@/lib/international";

type SavedAddress = {
  id: number;
  label: string;
  recipientName: string;
  shippingAddress: string;
  city: string;
  country: string;
  isDefault: boolean;
};

export default function Checkout() {
  const { market, t, formatCurrency } = useI18n();
  useSeo(t("checkout.metaTitle"), t("checkout.metaDescription"), { canonicalPath: "/checkout", robots: "noindex,follow" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, totalPrice, clearCart, setIsOpen } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { user, token } = useAuth();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    country: t(`checkout.country.${market.code}`),
    couponCode: "",
    giftCardCode: "",
    deliverySlot: "",
    fulfillmentType: "delivery" as "delivery" | "pickup",
    shippingService: "priority" as "economy" | "priority" | "express" | "pickup",
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");
  const marketGuide = getMarketGuide(market.code);

  const quoteItems = items.map((item) => ({ productId: item.id, quantity: item.quantity }));
  const hasItems = quoteItems.length > 0;
  const { data: quote, isLoading: isQuoteLoading, error: quoteError, refetch: refetchQuote } = useCheckoutQuote(
    {
      items: quoteItems,
      couponCode: form.couponCode || undefined,
      giftCardCode: form.giftCardCode || undefined,
      country: form.country || undefined,
      fulfillmentType: form.fulfillmentType,
      shippingService: form.shippingService,
    },
    hasItems,
  );
  const subtotalValue = quote?.converted.subtotal ?? quote?.subtotal ?? totalPrice();
  const importEstimate = estimateImportCharges(subtotalValue, market.code);
  const supportedPaymentMethods = quote?.market.supportedPaymentMethods ?? ["cod", "paypal", "card", "momo"];
  const supportedFulfillmentTypes = quote?.market.supportedFulfillmentTypes ?? ["delivery", "pickup"];
  const shippingServices = quote?.market.shippingServices ?? [];

  const quickPaymentOptions = [
    {
      id: "cod" as const,
      title: t("checkout.payOnDelivery"),
      subtitle: t("checkout.payOnDeliveryBody"),
      icon: Wallet,
    },
    {
      id: "paypal" as const,
      title: "PayPal",
      subtitle: t("checkout.paypalBody"),
      icon: CreditCard,
    },
    {
      id: "card" as const,
      title: t("checkout.cardTitle"),
      subtitle: t("checkout.cardBody"),
      icon: CreditCard,
    },
    {
      id: "momo" as const,
      title: t("checkout.momoTitle"),
      subtitle: t("checkout.momoBody"),
      icon: Smartphone,
    },
  ];
  const primaryButtonLabel = form.paymentMethod === "cod" ? t("checkout.placeCodOrder") : t("checkout.continueToPayment");

  const goToCheckoutUrl = (checkoutUrl: string) => {
    if (/^https?:\/\//i.test(checkoutUrl)) {
      window.location.assign(checkoutUrl);
      return;
    }
    navigate(checkoutUrl);
  };

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
    const coupon = searchParams.get("coupon");
    if (!coupon) return;
    setForm((prev) => (
      prev.couponCode === coupon.toUpperCase()
        ? prev
        : { ...prev, couponCode: coupon.toUpperCase() }
    ));
    setShowPromoFields(true);
  }, [searchParams]);

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
    if (!token) {
      setSavedAddresses([]);
      setSelectedSavedAddressId("");
      return;
    }
    authFetch("/api/account/addresses")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        const next = Array.isArray(rows) ? rows as SavedAddress[] : [];
        setSavedAddresses(next);
        const defaultAddress = next.find((row) => row.isDefault) || next[0];
        if (!defaultAddress) return;
        setSelectedSavedAddressId((current) => current || String(defaultAddress.id));
      })
      .catch(() => setSavedAddresses([]));
  }, [token]);

  useEffect(() => {
    if (!selectedSavedAddressId) return;
    const selected = savedAddresses.find((row) => String(row.id) === selectedSavedAddressId);
    if (!selected) return;
    setForm((prev) => ({
      ...prev,
      customerName: selected.recipientName,
      shippingAddress: selected.shippingAddress,
      city: selected.city,
      country: selected.country,
    }));
    setSaveAddressLabel(selected.label);
  }, [savedAddresses, selectedSavedAddressId]);

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

  useEffect(() => {
    if (!quote) return;
    const nextPaymentMethod = supportedPaymentMethods.includes(form.paymentMethod)
      ? form.paymentMethod
      : quote.market.preferredPaymentMethod;
    const nextFulfillmentType = supportedFulfillmentTypes.includes(form.fulfillmentType)
      ? form.fulfillmentType
      : supportedFulfillmentTypes[0] || "delivery";
    const nextShippingService = shippingServices.some((service) => service.id === form.shippingService)
      ? form.shippingService
      : quote.market.selectedShippingService;

    if (
      nextPaymentMethod === form.paymentMethod
      && nextFulfillmentType === form.fulfillmentType
      && nextShippingService === form.shippingService
    ) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      paymentMethod: nextPaymentMethod,
      fulfillmentType: nextFulfillmentType,
      shippingService: nextShippingService,
    }));
  }, [form.fulfillmentType, form.paymentMethod, form.shippingService, quote, shippingServices, supportedFulfillmentTypes, supportedPaymentMethods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems) {
      toast({ variant: "destructive", title: t("checkout.cartEmpty"), description: t("checkout.cartEmptyBody") });
      return;
    }
    if (!quote) {
      toast({
        variant: "destructive",
        title: t("checkout.failed"),
        description: quoteError instanceof Error ? quoteError.message : t("checkout.quoteRequired"),
      });
      return;
    }

    try {
      const safePaymentMethod = supportedPaymentMethods.includes(form.paymentMethod)
        ? form.paymentMethod
        : quote.market.preferredPaymentMethod;
      const safeFulfillmentType = supportedFulfillmentTypes.includes(form.fulfillmentType)
        ? form.fulfillmentType
        : quote.market.supportedFulfillmentTypes[0] || "delivery";
      const safeShippingService = shippingServices.some((service) => service.id === form.shippingService && service.fulfillmentType === safeFulfillmentType)
        ? form.shippingService
        : quote.market.selectedShippingService;

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

      const order = await createOrder.mutateAsync({
        ...form,
        fulfillmentType: safeFulfillmentType,
        paymentMethod: safePaymentMethod,
        shippingService: safeShippingService,
        couponCode: form.couponCode || undefined,
        giftCardCode: form.giftCardCode || undefined,
        deliverySlot: form.deliverySlot || undefined,
        items: quoteItems,
      });

      if (token && saveAddressForLater && form.shippingAddress.trim() && form.city.trim() && form.country.trim()) {
        await authFetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: saveAddressLabel.trim() || "Saved address",
            recipientName: form.customerName,
            shippingAddress: form.shippingAddress,
            city: form.city,
            country: form.country,
            isDefault: savedAddresses.length === 0,
          }),
        }).catch(() => undefined);
      }

      sessionStorage.setItem(
        "checkout-payment-note",
        JSON.stringify({
          orderId: order.id,
          message: order.payment?.required ? t("checkout.paymentPendingNote") : t("checkout.orderPlacedNote"),
        }),
      );
      setOrderAccessToken(order.id, order.accessToken);

      if (order.payment?.required && order.payment.checkoutUrl) {
        goToCheckoutUrl(order.payment.checkoutUrl);
        return;
      }

      clearCart();
      setIsOpen(false);
      localStorage.removeItem(checkoutStorageKey);
      navigate(`/order-success/${order.id}`);
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
            <Link to="/shop">{t("checkout.goToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
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
            {quote && (
              <div className="rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("checkout.marketSupportTitle")}</p>
                <p className="mt-1">
                  {t("checkout.marketSupportBody", {
                    payments: quote.market.supportedPaymentMethods.map((method) => t(`checkout.method.${method}`)).join(", "),
                    fulfillment: quote.market.supportedFulfillmentTypes.map((type) => t(`checkout.fulfillment.${type}`)).join(", "),
                  })}
                </p>
              </div>
            )}
            {quote && (
              <div className="rounded-xl border border-border bg-card px-4 py-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{t("checkout.shippingEstimateTitle")}</p>
                    <p className="text-muted-foreground">
                      {form.fulfillmentType === "pickup"
                        ? t("checkout.pickupEstimate")
                        : t("checkout.shippingEstimateBody", {
                            min: quote.market.estimatedDaysMin,
                            max: quote.market.estimatedDaysMax,
                            zone: quote.market.shippingZone,
                          })}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    {t("checkout.freeShippingThreshold", { amount: formatCurrency(quote.converted ? quote.market.freeShippingThreshold * quote.market.exchangeRate : quote.market.freeShippingThreshold) })}
                  </div>
                </div>
                {quote.market.customsNotice && (
                  <p className="mt-3 text-amber-700">{quote.market.customsNotice}</p>
                )}
              </div>
            )}
            {quoteError && !quote && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
                <p className="font-medium text-foreground">{t("checkout.quoteErrorTitle")}</p>
                <p className="mt-1 text-muted-foreground">
                  {quoteError instanceof Error ? quoteError.message : t("checkout.quoteRequired")}
                </p>
                <div className="mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchQuote()}>
                    {t("checkout.retryQuote")}
                  </Button>
                </div>
              </div>
            )}

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
            <Input
              type="tel"
              placeholder={t(`checkout.phoneHint.${market.code}`)}
              value={form.customerPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
              required
            />
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">{t("checkout.deliveryTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.deliveryBody")}</p>
              </div>
            {token && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="font-medium">{t("checkout.savedAddresses")}</p>
                  <p className="text-sm text-muted-foreground">{t("checkout.savedAddressesBody")}</p>
                </div>
                {savedAddresses.length > 0 ? (
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedSavedAddressId}
                    onChange={(e) => setSelectedSavedAddressId(e.target.value)}
                  >
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.shippingAddress}{address.isDefault ? ` (${t("checkout.savedDefault")})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("checkout.noSavedAddresses")}</p>
                )}
              </div>
            )}
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
            {token && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveAddressForLater}
                    onChange={(e) => setSaveAddressForLater(e.target.checked)}
                  />
                  {t("checkout.saveAddress")}
                </label>
                {saveAddressForLater && (
                  <Input
                    placeholder={t("checkout.addressLabelHint")}
                    value={saveAddressLabel}
                    onChange={(e) => setSaveAddressLabel(e.target.value)}
                  />
                )}
              </div>
            )}
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
            {shippingServices.length > 0 && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="font-medium">{t("checkout.shippingServiceTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("checkout.shippingServiceBody")}</p>
                </div>
                <div className="grid gap-3">
                  {shippingServices
                    .filter((service) => service.fulfillmentType === form.fulfillmentType)
                    .map((service) => {
                      const active = form.shippingService === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, shippingService: service.id }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            active ? "border-primary bg-primary/5" : "border-border hover:bg-background"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{t(`checkout.shippingService.${service.id}`)}</p>
                              <p className="text-sm text-muted-foreground">
                                {t("checkout.shippingServiceWindow", {
                                  min: service.estimatedDaysMin,
                                  max: service.estimatedDaysMax,
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(service.fee)}</p>
                              {active && <p className="text-xs text-primary">{t("checkout.selected")}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={form.fulfillmentType === "delivery" ? "default" : "outline"}
                onClick={() => {
                  if (!supportedFulfillmentTypes.includes("delivery")) return;
                  const nextSlot = deliverySlotOptions.find((slot) => !slot.isPickup && slot.available)?.label || form.deliverySlot;
                  const nextService = shippingServices.find((service) => service.fulfillmentType === "delivery")?.id || "priority";
                  setForm((prev) => ({ ...prev, fulfillmentType: "delivery", deliverySlot: nextSlot, shippingService: nextService }));
                }}
                className="rounded-full"
                disabled={!supportedFulfillmentTypes.includes("delivery")}
              >
                {t("checkout.homeDelivery")}
              </Button>
              <Button
                type="button"
                variant={form.fulfillmentType === "pickup" ? "default" : "outline"}
                onClick={() => {
                  if (!supportedFulfillmentTypes.includes("pickup")) return;
                  setForm((prev) => ({ ...prev, fulfillmentType: "pickup", deliverySlot: "Store Pickup - Ready in 2 hours", shippingService: "pickup" }));
                }}
                className="rounded-full"
                disabled={!supportedFulfillmentTypes.includes("pickup")}
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
                  const supported = supportedPaymentMethods.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (!supported) return;
                        setForm((prev) => ({ ...prev, paymentMethod: option.id }));
                      }}
                      disabled={!supported}
                      className={`rounded-2xl border p-4 text-left transition ${
                        !supported
                          ? "border-border bg-muted/20 opacity-55 cursor-not-allowed"
                          : active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
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
                              {option.id === quote?.market.preferredPaymentMethod && supported && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                  {t("checkout.recommended")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                            {!supported && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("checkout.methodUnavailable")}
                              </p>
                            )}
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
              {form.paymentMethod === "cod"
                ? t("checkout.codActive")
                : t("checkout.paymentHostNote")}
            </div>
            <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              {t("checkout.secureLine")}
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full h-12" disabled={createOrder.isPending || isQuoteLoading || !quote || Boolean(quoteError)}>
              {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
              {createOrder.isPending ? t("checkout.processing") : isQuoteLoading ? t("checkout.loadingQuote") : primaryButtonLabel}
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
            <div className="mt-6 rounded-2xl border border-border bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{t("intl.checkoutTitle")}</h3>
                <span className="text-xs text-muted-foreground">
                  {t("intl.deliveryWindow", {
                    min: marketGuide.deliveryDays[0],
                    max: marketGuide.deliveryDays[1],
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`intl.clearance.${marketGuide.clearanceLabel}`)}
              </p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("intl.dutyEstimate")}</span>
                  <span>{formatCurrency(importEstimate.dutyEstimate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("intl.handlingEstimate")}</span>
                  <span>{formatCurrency(importEstimate.handlingEstimate)}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {marketGuide.taxIncluded
                  ? t("intl.taxIncluded")
                  : t("intl.taxExcluded")}
              </p>
              {marketGuide.customsThreshold !== undefined && (
                <p className="mt-2 text-xs text-amber-700">
                  {t("intl.customsThreshold", {
                    amount: formatCurrency(marketGuide.customsThreshold),
                  })}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
