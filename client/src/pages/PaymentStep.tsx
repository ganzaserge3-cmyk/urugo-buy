import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmPayment, usePaymentSession } from "@/hooks/use-checkout";
import { useCart } from "@/hooks/use-cart";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function PaymentStep() {
  const { t } = useI18n();
  useSeo(t("payment.metaTitle"), t("payment.metaDescription"));

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = Number(id);
  const sessionToken = searchParams.get("payment_session");
  const payerId = searchParams.get("PayerID") || undefined;
  const providerToken = searchParams.get("token") || undefined;
  const action = searchParams.get("action");
  const { data: session, isLoading } = usePaymentSession(orderId, sessionToken);
  const confirmPayment = useConfirmPayment(orderId);
  const { clearCart, setIsOpen } = useCart();
  const [message, setMessage] = useState(t("payment.preparing"));
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (!sessionToken || !session || hasProcessedRef.current) return;

    if (action === "fail") {
      hasProcessedRef.current = true;
      setMessage(t("payment.cancelledUpdating"));
      confirmPayment
        .mutateAsync({ sessionToken, action: "fail" })
        .then(() => {
          sessionStorage.setItem(
            "checkout-payment-note",
            JSON.stringify({ orderId, message: t("payment.cancelledNote") }),
          );
          navigate(`/order-success/${orderId}`, { replace: true });
        })
        .catch((error) => {
          setMessage(error instanceof Error ? error.message : t("payment.cancelFailed"));
          hasProcessedRef.current = false;
        });
      return;
    }

    if (session.provider === "paypal" && session.approvalUrl && !payerId && session.status === "created") {
      hasProcessedRef.current = true;
      window.location.assign(session.approvalUrl);
      return;
    }

    if (payerId && session.status !== "captured") {
      hasProcessedRef.current = true;
      setMessage(t("payment.confirming"));
      confirmPayment
        .mutateAsync({ sessionToken, action: "confirm", payerId, providerToken })
        .then(() => {
          clearCart();
          setIsOpen(false);
          localStorage.removeItem("checkout-draft");
          sessionStorage.setItem(
            "checkout-payment-note",
            JSON.stringify({ orderId, message: t("payment.confirmedNote") }),
          );
          navigate(`/order-success/${orderId}`, { replace: true });
        })
        .catch((error) => {
          setMessage(error instanceof Error ? error.message : t("payment.confirmFailed"));
          hasProcessedRef.current = false;
        });
    }
  }, [action, clearCart, confirmPayment, navigate, orderId, payerId, providerToken, session, sessionToken, setIsOpen]);

  useEffect(() => {
    if (!session || !sessionToken || hasProcessedRef.current) return;

    if (session.status === "captured") {
      hasProcessedRef.current = true;
      clearCart();
      setIsOpen(false);
      localStorage.removeItem("checkout-draft");
      sessionStorage.setItem(
        "checkout-payment-note",
        JSON.stringify({ orderId, message: t("payment.confirmedNote") }),
      );
      navigate(`/order-success/${orderId}`, { replace: true });
    }
  }, [clearCart, navigate, orderId, session, sessionToken, setIsOpen]);

  const handleDemoAction = async (nextAction: "confirm" | "fail") => {
    if (!sessionToken) return;
    setMessage(nextAction === "confirm" ? t("payment.confirming") : t("payment.markingFailed"));
    try {
      const result = await confirmPayment.mutateAsync({ sessionToken, action: nextAction });
      if (result.paymentStatus === "paid") {
        clearCart();
        setIsOpen(false);
        localStorage.removeItem("checkout-draft");
        sessionStorage.setItem(
          "checkout-payment-note",
          JSON.stringify({ orderId, message: t("payment.confirmedNote") }),
        );
      } else {
        sessionStorage.setItem(
          "checkout-payment-note",
          JSON.stringify({ orderId, message: t("payment.notCompleted") }),
        );
      }
      navigate(`/order-success/${orderId}`, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("payment.updateFailed"));
    }
  };

  if (!sessionToken || !Number.isFinite(orderId)) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
          <h1 className="mb-2 font-display text-3xl font-bold">{t("payment.missingTitle")}</h1>
          <p className="mb-6 text-muted-foreground">{t("payment.missingBody")}</p>
          <Button asChild className="rounded-full">
            <Link to="/checkout">{t("payment.returnToCheckout")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("payment.loading")}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
          <h1 className="mb-2 font-display text-3xl font-bold">{t("payment.notFoundTitle")}</h1>
          <p className="mb-6 text-muted-foreground">{t("payment.notFoundBody")}</p>
          <Button asChild className="rounded-full">
            <Link to="/checkout">{t("payment.returnToCheckout")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-20 pt-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{t("payment.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("payment.orderLabel", { orderNumber: session.orderNumber })}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("payment.method")}</span>
            <span className="font-medium capitalize">{session.method}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">{t("payment.amount")}</span>
            <span className="font-medium">{session.currencyCode} {session.amount.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">{t("payment.provider")}</span>
            <span className="font-medium uppercase">{session.provider}</span>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          {message}
        </div>

        {session.provider === "demo" && session.status === "created" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("payment.demoBody")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full rounded-full" onClick={() => handleDemoAction("confirm")} disabled={confirmPayment.isPending}>
                {confirmPayment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t("payment.confirmButton")}
              </Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => handleDemoAction("fail")} disabled={confirmPayment.isPending}>
                <XCircle className="mr-2 h-4 w-4" />
                {t("payment.failButton")}
              </Button>
            </div>
          </div>
        )}

        {session.provider === "paypal" && !payerId && (
          <p className="text-sm text-muted-foreground">
            {t("payment.redirectingPaypal")}
          </p>
        )}

        {(session.status === "captured" || session.status === "approved") && (
          <p className="text-sm text-green-700">{t("payment.receivedRedirect")}</p>
        )}

        {(session.status === "failed" || session.status === "expired") && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {session.status === "expired"
                ? t("payment.expiredBody")
                : t("payment.inactiveBody")}
            </p>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to={`/order-success/${orderId}`}>{t("payment.goToOrderSummary")}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
