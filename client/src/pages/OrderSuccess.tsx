import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder, useOrderTracking, useRestartPayment, useResumePayment } from "@/hooks/use-checkout";
import { useEffect, useState } from "react";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";
import { formatOrderMoney } from "@/lib/order-pricing";
import { useToast } from "@/hooks/use-toast";
import { getOrderAccessHeaders } from "@/lib/order-access";

function getPaymentTone(status: string) {
  if (status === "paid") {
    return {
      titleClassName: "text-green-500",
      noticeClassName: "border-green-300 bg-green-50 text-green-900",
    };
  }
  if (status === "payment_failed") {
    return {
      titleClassName: "text-amber-500",
      noticeClassName: "border-amber-300 bg-amber-50 text-amber-900",
    };
  }
  return {
    titleClassName: "text-primary",
    noticeClassName: "border-primary/20 bg-primary/5 text-foreground",
  };
}

export default function OrderSuccess() {
  const { t, formatCurrency, formatDateTime } = useI18n();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { data, isLoading } = useOrder(orderId);
  const { data: tracking } = useOrderTracking(orderId);
  const [notificationPreview, setNotificationPreview] = useState<{ emailMessage: string; smsMessage: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [paymentNotice, setPaymentNotice] = useState<string>("");
  const { data: resumePayment, isLoading: isResumePaymentLoading } = useResumePayment(orderId, paymentStatus !== "paid");
  const restartPayment = useRestartPayment(orderId);
  useSeo(t("orderSuccess.metaTitle"), t("orderSuccess.metaDescription"));

  const resolvedPaymentStatus = paymentStatus || data?.order.paymentStatus || "pending";
  const paymentTone = getPaymentTone(resolvedPaymentStatus);
  const heroTitle =
    resolvedPaymentStatus === "paid"
      ? t("orderSuccess.confirmedTitle")
      : resolvedPaymentStatus === "payment_failed"
        ? t("orderSuccess.paymentFailedTitle")
        : t("orderSuccess.pendingPaymentTitle");
  const heroBody =
    resolvedPaymentStatus === "paid"
      ? t("orderSuccess.confirmedBody")
      : resolvedPaymentStatus === "payment_failed"
        ? t("orderSuccess.paymentFailedBody")
        : t("orderSuccess.pendingPaymentBody");
  const canResumePayment =
    resolvedPaymentStatus !== "paid" &&
    Boolean(resumePayment) &&
    Boolean(data?.order.paymentMethod) &&
    data?.order.paymentMethod !== "cod";

  const handleResumePayment = () => {
    if (!resumePayment?.checkoutUrl) return;
    if (/^https?:\/\//i.test(resumePayment.checkoutUrl)) {
      window.location.assign(resumePayment.checkoutUrl);
      return;
    }
    window.location.assign(resumePayment.checkoutUrl);
  };

  const handleRestartPayment = async () => {
    try {
      const nextSession = await restartPayment.mutateAsync();
      window.location.assign(nextSession.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("orderSuccess.restartUnavailableBody");
      toast({
        variant: "destructive",
        title: t("orderSuccess.retryUnavailable"),
        description: message,
      });
    }
  };

  useEffect(() => {
    if (!orderId) return;
    try {
      const raw = sessionStorage.getItem("checkout-payment-note");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { orderId?: number; message?: string };
      if (parsed.orderId === orderId && parsed.message) {
        setPaymentNotice(parsed.message);
        sessionStorage.removeItem("checkout-payment-note");
      }
    } catch {
      sessionStorage.removeItem("checkout-payment-note");
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/notifications/${orderId}`, {
      headers: getOrderAccessHeaders(orderId),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setNotificationPreview(payload))
      .catch(() => setNotificationPreview(null));
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const poll = setInterval(() => {
      fetch(`/api/orders/${orderId}`, {
        headers: getOrderAccessHeaders(orderId),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (payload?.order?.paymentStatus) setPaymentStatus(payload.order.paymentStatus);
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(poll);
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto border rounded-2xl p-10 animate-pulse bg-muted/20">
          <div className="h-8 w-1/3 bg-muted rounded mb-6" />
          <div className="h-4 w-2/3 bg-muted rounded mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center border rounded-2xl p-10 bg-muted/20">
          <h1 className="font-display text-4xl font-bold mb-3">{t("orderSuccess.notFoundTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("orderSuccess.notFoundBody")}</p>
          <Button asChild className="rounded-full">
            <Link to="/shop">{t("orderSuccess.backToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-3xl mx-auto border border-border rounded-2xl p-8 md:p-10 bg-card">
        <div className="text-center mb-8">
          <CheckCircle2 className={`w-16 h-16 mx-auto mb-4 ${paymentTone.titleClassName}`} />
          <h1 className="font-display text-4xl font-bold mb-2">{heroTitle}</h1>
          <p className="text-muted-foreground">{heroBody}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm border border-border rounded-xl p-4 mb-6">
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.orderNumber")}</p>
            <p className="font-semibold">{data.order.orderNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.status")}</p>
            <p className="font-semibold capitalize">{data.order.status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.customer")}</p>
            <p className="font-semibold">{data.order.customerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("checkout.phone")}</p>
            <p className="font-semibold">{data.order.customerPhone || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.total")}</p>
            <p className="font-semibold">{formatOrderMoney(data.order.total, data.order, formatCurrency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.payment")}</p>
            <p className="font-semibold capitalize">
              {(data.order.paymentMethod || t("orderSuccess.cashOnDelivery")).replace("cod", t("orderSuccess.cashOnDelivery"))} ({resolvedPaymentStatus})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("orderSuccess.deliverySlot")}</p>
            <p className="font-semibold">{data.order.deliverySlot || t("orderSuccess.standardDelivery")}</p>
          </div>
        </div>

        {paymentNotice && (
          <div className={`mb-6 rounded-xl border p-4 text-sm ${paymentTone.noticeClassName}`}>
            {paymentNotice}
          </div>
        )}

        {resolvedPaymentStatus !== "paid" && (
          <div className="mb-6 rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="font-semibold">{t("orderSuccess.finishPayment")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {canResumePayment
                ? t("orderSuccess.resumePaymentBody")
                : t("orderSuccess.restartPaymentBody")}
            </p>
            {canResumePayment && (
              <Button className="mt-4 rounded-full" onClick={handleResumePayment}>
                {t("orderSuccess.resumePayment")}
              </Button>
            )}
            {!canResumePayment && isResumePaymentLoading && (
              <div className="mt-4 inline-flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("orderSuccess.checkingPayment")}
              </div>
            )}
            {!canResumePayment && !isResumePaymentLoading && data?.order.paymentMethod !== "cod" && (
              <Button
                className="mt-4 rounded-full"
                onClick={handleRestartPayment}
                disabled={restartPayment.isPending}
              >
                {restartPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("orderSuccess.startNewPayment")}
              </Button>
            )}
          </div>
        )}

        {notificationPreview && (
          <div className="mb-8 border border-border rounded-xl p-4 bg-muted/20">
            <h3 className="font-semibold mb-2">{t("orderSuccess.notificationPreview")}</h3>
            <p className="text-sm text-muted-foreground mb-1">{notificationPreview.emailMessage}</p>
            <p className="text-sm text-muted-foreground">{notificationPreview.smsMessage}</p>
          </div>
        )}

        {tracking && (
          <div className="mb-8 border border-border rounded-xl p-4 bg-muted/20">
            <h3 className="font-semibold mb-3">{t("orderSuccess.orderTracking")}</h3>
            <div className="mb-3">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${tracking.progress || 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("orderSuccess.progress", { value: tracking.progress || 0 })}</p>
            </div>
            <div className="space-y-2">
              {tracking.timeline.map((step: { status: string; completed: boolean; timestamp?: string }) => (
                <div key={step.status} className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${step.completed ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <span className="capitalize">{step.status}</span>
                  {step.timestamp && <span className="text-xs text-muted-foreground">{formatDateTime(step.timestamp)}</span>}
                </div>
              ))}
            </div>
            {tracking.shipment && (tracking.shipment.carrier || tracking.shipment.trackingNumber) && (
              <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm">
                <p className="font-medium">{tracking.shipment.carrier || "Shipment in progress"}</p>
                {tracking.shipment.trackingNumber && (
                  <p className="text-muted-foreground">Tracking: {tracking.shipment.trackingNumber}</p>
                )}
                {tracking.shipment.shippingService && (
                  <p className="text-muted-foreground capitalize">
                    Service: {String(tracking.shipment.shippingService).replace("_", " ")}
                  </p>
                )}
                {tracking.shipment.shippingNote && (
                  <p className="text-muted-foreground">{tracking.shipment.shippingNote}</p>
                )}
                {tracking.shipment.trackingUrl && (
                  <a
                    href={tracking.shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-primary underline"
                  >
                    Open carrier tracking
                  </a>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3">{t("orderSuccess.estimatedDelivery", { date: formatDateTime(tracking.eta) })}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4">{t("orderSuccess.items")}</h2>
          <div className="space-y-3">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm border-b border-border pb-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">{t("orderSuccess.qty", { count: item.quantity })}</p>
                </div>
                <p>{formatOrderMoney(item.lineTotal, data.order, formatCurrency)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="rounded-full w-full sm:w-auto">
            <Link to="/shop">{t("orderSuccess.continueShopping")}</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full w-full sm:w-auto">
            <Link to="/">{t("orderSuccess.backHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
