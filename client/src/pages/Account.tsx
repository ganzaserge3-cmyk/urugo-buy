import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  type AccountPreferences,
  useAccountOrders,
  useAccountAlertsFeed,
  useAccountPreferences,
  useRedeemReferralCode,
  useAccountSummary,
  useSaveAccountPreferences,
} from "@/hooks/use-account";
import { authFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useCreateWishlistShare, useMoveWishlistItem, useWishlistFolders } from "@/hooks/use-wishlist";
import { useI18n } from "@/lib/i18n";
import { formatOrderMoney } from "@/lib/order-pricing";
import { setOrderAccessToken } from "@/lib/order-access";

const defaultPreferences: AccountPreferences = {
  priceDropAlerts: true,
  stockAlerts: true,
  essentialsSubscription: false,
  twoFactorEnabled: false,
};

export default function Account() {
  const { t, formatCurrency, formatDateTime } = useI18n();
  useSeo(t("account.metaTitle"), t("account.metaDescription"), { canonicalPath: "/account", robots: "noindex,follow" });
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: summary, refetch: refetchSummary } = useAccountSummary();
  const { data: orders = [], refetch: refetchOrders } = useAccountOrders();
  const { data: alertsFeed = [] } = useAccountAlertsFeed();
  const { data: preferences } = useAccountPreferences();
  const savePreferences = useSaveAccountPreferences();
  const redeemReferral = useRedeemReferralCode();
  const createWishlistShare = useCreateWishlistShare();
  const moveWishlistItem = useMoveWishlistItem();
  const { data: wishlistFolders = [] } = useWishlistFolders();

  const [localPrefs, setLocalPrefs] = useState<AccountPreferences>(defaultPreferences);
  const [supportTopic, setSupportTopic] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnResolution, setReturnResolution] = useState("refund");
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: t("account.chat.welcome") },
  ]);
  const [wishlistShareLink, setWishlistShareLink] = useState("");
  const [wishlistFolderDrafts, setWishlistFolderDrafts] = useState<Record<number, string>>({});
  const [referralInput, setReferralInput] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: number; frequency: string; status: string; nextRunAt?: string }>>([]);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [supportTickets, setSupportTickets] = useState<Array<{ id: number; topic: string; message: string; status: string; createdAt: string }>>([]);
  const [returnsHistory, setReturnsHistory] = useState<Array<{ id: number; orderId: number; reason: string; resolution?: string | null; refundAmount?: string | null; refundCurrency?: string | null; adminNote?: string | null; status: string; createdAt: string; timeline?: Array<{ id: number; status: string; note?: string | null; createdAt: string }> }>>([]);
  const [notificationDevices, setNotificationDevices] = useState<Array<{ id: number; endpoint: string; platform: string; createdAt: string }>>([]);
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: number; label: string; recipientName: string; shippingAddress: string; city: string; country: string; isDefault: boolean }>>([]);
  const [addressForm, setAddressForm] = useState({
    label: "",
    recipientName: "",
    shippingAddress: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    if (preferences) setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    authFetch("/api/subscriptions")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setSubscriptions(Array.isArray(rows) ? rows : []))
      .catch(() => setSubscriptions([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    authFetch("/api/account/support/tickets")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setSupportTickets(Array.isArray(rows) ? rows : []))
      .catch(() => setSupportTickets([]));

    authFetch("/api/account/returns")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setReturnsHistory(Array.isArray(rows) ? rows : []))
      .catch(() => setReturnsHistory([]));

    authFetch("/api/account/notifications/subscriptions")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setNotificationDevices(Array.isArray(rows) ? rows : []))
      .catch(() => setNotificationDevices([]));

    authFetch("/api/account/addresses")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setSavedAddresses(Array.isArray(rows) ? rows : []))
      .catch(() => setSavedAddresses([]));
  }, [token]);

  const siteBaseUrl = useMemo(() => {
    return typeof window !== "undefined" ? window.location.origin : "";
  }, []);
  const referralShareLink = useMemo(() => {
    if (!siteBaseUrl || !summary?.referralCode) return "";
    return `${siteBaseUrl}/signup?ref=${encodeURIComponent(summary.referralCode)}`;
  }, [siteBaseUrl, summary?.referralCode]);
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery =
        !orderQuery.trim() ||
        order.orderNumber.toLowerCase().includes(orderQuery.trim().toLowerCase());
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orderQuery, orderStatusFilter, orders]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto border border-border rounded-2xl p-8 text-center bg-card">
          <h1 className="font-display text-4xl font-bold mb-3">{t("account.signInTitle")}</h1>
          <p className="text-muted-foreground mb-6">{t("account.signInBody")}</p>
          <Button asChild className="rounded-full">
            <Link href="/login">{t("account.goToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSavePreferences = async () => {
    try {
      if (localPrefs.twoFactorEnabled && !twoFactorVerified) {
        toast({
          variant: "destructive",
          title: t("account.toast.2faRequired"),
          description: t("account.toast.2faRequiredBody"),
        });
        return;
      }
      await savePreferences.mutateAsync(localPrefs);
      toast({ title: t("account.toast.preferencesSaved") });
      await refetchSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("account.toast.saveFailed"),
        description: error instanceof Error ? error.message : t("common.tryAgain"),
      });
    }
  };

  const handleReorder = async (orderId: number) => {
    const res = await authFetch(`/api/account/reorder/${orderId}`, { method: "POST" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: t("account.toast.reorderFailed") }));
      toast({ variant: "destructive", title: t("account.toast.reorderFailed"), description: payload.message });
      return;
    }
    const payload = await res.json().catch(() => null) as { id: number; accessToken?: string } | null;
    if (payload?.accessToken) {
      setOrderAccessToken(payload.id, payload.accessToken);
    }
    toast({ title: t("account.toast.reorderCreated"), description: t("account.toast.reorderCreatedBody") });
    await refetchOrders();
    await refetchSummary();
    if (payload?.id) {
      setLocation(`/order-success/${payload.id}`);
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: supportTopic, message: supportMessage }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: t("account.toast.ticketFailed") }));
      toast({ variant: "destructive", title: t("account.toast.ticketFailed"), description: payload.message });
      return;
    }
    setSupportTopic("");
    setSupportMessage("");
    toast({ title: t("account.toast.ticketSubmitted") });
    const rows = await authFetch("/api/account/support/tickets").then((r) => (r.ok ? r.json() : []));
    setSupportTickets(Array.isArray(rows) ? rows : []);
  };

  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = Number(returnOrderId);
    const res = await authFetch("/api/returns/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: returnReason, resolution: returnResolution }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: t("account.toast.returnFailed") }));
      toast({ variant: "destructive", title: t("account.toast.returnFailed"), description: payload.message });
      return;
    }
    setReturnOrderId("");
    setReturnReason("");
    setReturnResolution("refund");
    toast({ title: t("account.toast.returnSubmitted") });
    const rows = await authFetch("/api/account/returns").then((r) => (r.ok ? r.json() : []));
    setReturnsHistory(Array.isArray(rows) ? rows : []);
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const next = chatText.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: next }]);
    setChatText("");
    try {
      const res = await authFetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t("account.liveChatRequest"), message: next }),
      });
      if (!res.ok) throw new Error(t("account.chatRequestFailed"));
      const rows = await authFetch("/api/account/support/tickets").then((r) => (r.ok ? r.json() : []));
      setSupportTickets(Array.isArray(rows) ? rows : []);
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", text: t("account.chat.ticketCreated") },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", text: t("account.chat.unavailable") },
      ]);
    }
  };

  const handleGenerateWishlistShare = async () => {
    try {
      const payload = await createWishlistShare.mutateAsync();
      setWishlistShareLink(`${siteBaseUrl}/wishlist/${payload.token}`);
      toast({ title: t("account.toast.shareGenerated"), description: t("account.toast.validUntil", { date: formatDateTime(payload.expiresAt) }) });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("account.toast.shareFailed"),
        description: error instanceof Error ? error.message : t("common.tryAgain"),
      });
    }
  };

  const handleSendTwoFactorCode = async () => {
    const res = await authFetch("/api/account/2fa/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "settings" }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: t("account.toast.2faSendFailed") }));
      toast({ variant: "destructive", title: t("account.toast.2faSendFailed"), description: payload.message });
      return;
    }
    const payload = await res.json();
    const debugCode = payload.debugCode ? ` (Dev code: ${payload.debugCode})` : "";
    toast({ title: t("account.toast.2faCodeSent"), description: t("account.toast.checkEmail", { debug: debugCode }) });
  };

  const handleVerifyTwoFactor = async () => {
    const res = await authFetch("/api/account/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "settings", code: twoFactorCode }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: t("account.toast.2faVerifyFailed") }));
      toast({ variant: "destructive", title: t("account.toast.2faVerifyFailed"), description: payload.message });
      setTwoFactorVerified(false);
      return;
    }
    setTwoFactorVerified(true);
    toast({ title: t("account.toast.2faVerified") });
  };

  const createSubscription = async () => {
    const res = await authFetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequency: "weekly" }),
    });
    if (res.ok) {
      const rows = await authFetch("/api/subscriptions").then((r) => (r.ok ? r.json() : []));
      setSubscriptions(Array.isArray(rows) ? rows : []);
      toast({ title: t("account.toast.subscriptionCreated") });
    }
  };

  const updateSubscription = async (id: number, status: "active" | "paused" | "cancelled") => {
    const res = await authFetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const rows = await authFetch("/api/subscriptions").then((r) => (r.ok ? r.json() : []));
      setSubscriptions(Array.isArray(rows) ? rows : []);
    }
  };

  const registerPush = async () => {
    const endpoint = `https://push.urugobuy.local/${Date.now()}`;
    const res = await authFetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, platform: "web" }),
    });
    if (res.ok) {
      toast({ title: t("account.toast.pushEnabled") });
      const rows = await authFetch("/api/account/notifications/subscriptions").then((r) => (r.ok ? r.json() : []));
      setNotificationDevices(Array.isArray(rows) ? rows : []);
    }
  };

  const handleMoveWishlistItem = async (productId: number) => {
    const nextFolder = wishlistFolderDrafts[productId]?.trim();
    if (!nextFolder) return;
    try {
      await moveWishlistItem.mutateAsync({ productId, folderName: nextFolder });
      toast({ title: "Wishlist updated", description: `Moved item to ${nextFolder}.` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Move failed",
        description: error instanceof Error ? error.message : "Could not move wishlist item.",
      });
    }
  };

  const removeNotificationDevice = async (id: number) => {
    const res = await authFetch(`/api/account/notifications/subscriptions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Failed to remove device" }));
      toast({ variant: "destructive", title: t("account.toast.removeFailed"), description: payload.message });
      return;
    }
    setNotificationDevices((prev) => prev.filter((device) => device.id !== id));
    toast({ title: t("account.toast.deviceRemoved") });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addressForm,
        isDefault: savedAddresses.length === 0,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Failed to save address" }));
      toast({ variant: "destructive", title: t("account.toast.saveFailed"), description: payload.message });
      return;
    }
    setAddressForm({ label: "", recipientName: "", shippingAddress: "", city: "", country: "" });
    const rows = await authFetch("/api/account/addresses").then((r) => (r.ok ? r.json() : []));
    setSavedAddresses(Array.isArray(rows) ? rows : []);
    toast({ title: t("account.toast.addressSaved") });
  };

  const makeAddressDefault = async (id: number) => {
    const address = savedAddresses.find((row) => row.id === id);
    if (!address) return;
    const res = await authFetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...address, isDefault: true }),
    });
    if (!res.ok) return;
    const rows = await authFetch("/api/account/addresses").then((r) => (r.ok ? r.json() : []));
    setSavedAddresses(Array.isArray(rows) ? rows : []);
    toast({ title: t("account.toast.addressDefault") });
  };

  const deleteAddress = async (id: number) => {
    const res = await authFetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setSavedAddresses((prev) => prev.filter((address) => address.id !== id));
    toast({ title: t("account.toast.addressDeleted") });
  };

  const skipSubscriptionNext = async (id: number) => {
    const res = await authFetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skipNext: true }),
    });
    if (res.ok) {
      const rows = await authFetch("/api/subscriptions").then((r) => (r.ok ? r.json() : []));
      setSubscriptions(Array.isArray(rows) ? rows : []);
      toast({ title: t("account.toast.skipRun") });
    }
  };

  const handleRedeemReferral = async () => {
    if (!referralInput.trim()) return;
    try {
      const payload = await redeemReferral.mutateAsync(referralInput.trim());
      toast({ title: t("account.toast.referralRedeemed"), description: t("account.toast.referralRedeemedBody", { points: payload.awardedPoints }) });
      setReferralInput("");
      await refetchSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("account.toast.referralFailed"),
        description: error instanceof Error ? error.message : t("common.tryAgain"),
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold">{t("account.title")}</h1>
          <p className="text-muted-foreground">{t("account.subtitle")}</p>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t("account.loyaltyPoints")}</p>
            <p className="text-2xl font-bold">{summary?.loyaltyPoints ?? 0}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t("account.tier")}</p>
            <p className="text-2xl font-bold">{summary?.tier ?? "Bronze"}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t("account.lifetimeSpend")}</p>
            <p className="text-2xl font-bold">{formatCurrency(summary?.totalSpend ?? 0)}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t("account.referralCode")}</p>
            <p className="text-xl font-bold">{summary?.referralCode ?? t("account.na")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("account.redeemedCount", { count: summary?.referralsCount ?? 0 })}
            </p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">{t("account.referralRewards")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("account.referralBody")}
            </p>
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Tier progress</span>
                <span className="font-medium">
                  {summary?.nextTier ? `${summary.pointsToNextTier} points to ${summary.nextTier}` : "Top tier reached"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${summary?.tierProgressPercent ?? 0}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t("account.enterReferral")}
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
              />
              <Button onClick={handleRedeemReferral} disabled={redeemReferral.isPending}>
                {t("account.redeem")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={summary?.referralCode ?? ""} readOnly />
              <Button
                variant="outline"
                onClick={async () => {
                  if (!summary?.referralCode) return;
                  await navigator.clipboard.writeText(summary.referralCode);
                  toast({ title: t("account.toast.linkCopied") });
                }}
              >
                Copy code
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={referralShareLink} readOnly placeholder="Referral signup link" />
              <Button
                variant="outline"
                onClick={async () => {
                  if (!referralShareLink) return;
                  await navigator.clipboard.writeText(referralShareLink);
                  toast({ title: "Referral link copied" });
                }}
              >
                Copy link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("account.bonusPoints", { count: summary?.referralBonusPoints ?? 0 })}
            </p>
            <p className="text-xs text-muted-foreground">
              Redeemed so far: {summary?.redeemedPoints ?? 0} points ({formatCurrency(summary?.redeemedDiscount ?? 0)})
            </p>
          </div>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">{t("account.alertFeed")}</h2>
            {alertsFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.noAlerts")}</p>
            ) : (
              <div className="space-y-2">
                {alertsFeed.map((item, idx) => (
                  <div key={`${item.productId}-${item.type}-${idx}`} className="border border-border rounded-lg p-2 text-sm">
                    <p className="font-medium capitalize">{item.type.replace("-", " ")}</p>
                    <p className="text-muted-foreground">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
            <h2 className="font-display text-2xl font-semibold">{t("account.alertsSecurity")}</h2>
            <label className="flex items-center justify-between">
              <span>{t("account.pref.priceDrop")}</span>
              <input
                type="checkbox"
                checked={localPrefs.priceDropAlerts}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, priceDropAlerts: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>{t("account.pref.stock")}</span>
              <input
                type="checkbox"
                checked={localPrefs.stockAlerts}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, stockAlerts: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>{t("account.pref.subscription")}</span>
              <input
                type="checkbox"
                checked={localPrefs.essentialsSubscription}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, essentialsSubscription: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>{t("account.pref.twoFactor")}</span>
              <input
                type="checkbox"
                checked={localPrefs.twoFactorEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setLocalPrefs((prev) => ({ ...prev, twoFactorEnabled: enabled }));
                  if (!enabled) {
                    setTwoFactorVerified(false);
                    setTwoFactorCode("");
                  }
                }}
              />
            </label>
            {localPrefs.twoFactorEnabled && (
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSendTwoFactorCode}>
                    {t("account.sendCode")}
                  </Button>
                  <Input
                    placeholder={t("account.codePlaceholder")}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                  <Button type="button" onClick={handleVerifyTwoFactor}>{t("account.verify")}</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("account.status", { value: twoFactorVerified ? t("account.verified") : t("account.notVerified") })}
                </p>
              </div>
            )}
            <Button className="rounded-full" onClick={handleSavePreferences} disabled={savePreferences.isPending}>
              {t("account.savePreferences")}
            </Button>
          </div>

          <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
            <h2 className="font-display text-2xl font-semibold">{t("account.wishlistSharing")}</h2>
            <p className="text-sm text-muted-foreground">{t("account.wishlistBody")}</p>
            <Input value={wishlistShareLink} readOnly placeholder={t("account.generateShareLink")} />
            <Button className="rounded-full" onClick={handleGenerateWishlistShare} disabled={createWishlistShare.isPending}>
              {t("account.generateLink")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                if (!wishlistShareLink) return;
                await navigator.clipboard.writeText(wishlistShareLink);
                toast({ title: t("account.toast.linkCopied") });
              }}
              disabled={!wishlistShareLink}
            >
              {t("account.copyShareLink")}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={registerPush}>
              {t("account.enablePush")}
            </Button>
            <div className="space-y-3 pt-2">
              <div>
                <h3 className="font-medium">Wishlist folders</h3>
                <p className="text-sm text-muted-foreground">Group saved products into simple named collections.</p>
              </div>
              {wishlistFolders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No wishlist items yet.</p>
              ) : (
                wishlistFolders.map((folder) => (
                  <div key={folder.folderName} className="rounded-xl border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{folder.folderName}</p>
                        <p className="text-xs text-muted-foreground">{folder.count} saved item(s)</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {folder.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={wishlistFolderDrafts[item.id] ?? item.folderName}
                                onChange={(e) => setWishlistFolderDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                className="h-9 w-36"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMoveWishlistItem(item.id)}
                                disabled={moveWishlistItem.isPending}
                              >
                                Move
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2 pt-2">
              {notificationDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("account.noDevices")}</p>
              ) : (
                notificationDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium capitalize">{t("account.device", { platform: device.platform })}</p>
                      <p className="text-muted-foreground">{t("account.addedAt", { date: formatDateTime(device.createdAt) })}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeNotificationDevice(device.id)}>
                      {t("account.remove")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">{t("account.subscriptions")}</h2>
            <Button onClick={createSubscription} className="rounded-full">{t("account.newSubscription")}</Button>
          </div>
          <div className="space-y-2">
            {subscriptions.length === 0 ? (
              <p className="text-muted-foreground">{t("account.noSubscriptions")}</p>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="border border-border rounded-lg p-3 flex items-center justify-between text-sm">
                  <span>#{sub.id} - {sub.frequency} - {sub.status}{sub.nextRunAt ? ` - ${t("account.nextRun", { date: new Date(sub.nextRunAt).toLocaleDateString() })}` : ""}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => skipSubscriptionNext(sub.id)}>{t("account.skipNext")}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateSubscription(sub.id, "paused")}>{t("account.pause")}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateSubscription(sub.id, "active")}>{t("account.resume")}</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateSubscription(sub.id, "cancelled")}>{t("account.cancel")}</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveAddress} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">{t("account.addresses")}</h2>
            <p className="text-sm text-muted-foreground">{t("account.addressesBody")}</p>
            <Input
              placeholder={t("account.addressLabel")}
              value={addressForm.label}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
              required
            />
            <Input
              placeholder={t("account.recipientName")}
              value={addressForm.recipientName}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, recipientName: e.target.value }))}
              required
            />
            <Input
              placeholder={t("checkout.shippingAddress")}
              value={addressForm.shippingAddress}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
              required
            />
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder={t("checkout.city")}
                value={addressForm.city}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                required
              />
              <Input
                placeholder={t("checkout.country")}
                value={addressForm.country}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="rounded-full">{t("account.saveAddress")}</Button>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">{t("checkout.savedAddresses")}</h2>
            {savedAddresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.noAddresses")}</p>
            ) : (
              savedAddresses.map((address) => (
                <div key={address.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {address.label}{address.isDefault ? ` - ${t("checkout.savedDefault")}` : ""}
                      </p>
                      <p className="text-muted-foreground">{address.recipientName}</p>
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button size="sm" variant="outline" onClick={() => makeAddressDefault(address.id)}>
                          {t("account.makeDefault")}
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => deleteAddress(address.id)}>
                        {t("account.deleteAddress")}
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">{address.shippingAddress}</p>
                  <p className="text-muted-foreground">{address.city}, {address.country}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="font-display text-2xl font-semibold">{t("account.orderHistory")}</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder={t("account.searchOrder")}
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="sm:w-52"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">{t("account.allStatuses")}</option>
                <option value="pending">Pending</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <p className="text-muted-foreground">{t("account.noOrders")}</p>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="grid grid-cols-12 gap-2 border-b border-border pb-3 text-sm">
                  <span className="col-span-3">{order.orderNumber}</span>
                  <span className="col-span-3 capitalize">{order.status}</span>
                  <span className="col-span-2">{formatOrderMoney(order.total, order, formatCurrency)}</span>
                  <span className="col-span-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReorder(order.id)}>{t("account.reorder")}</Button>
                    <Button size="sm" asChild>
                      <Link href={`/order-success/${order.id}`}>{t("account.invoice")}</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateSupportTicket} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">{t("account.supportTicket")}</h2>
            <Input
              placeholder={t("account.topic")}
              value={supportTopic}
              onChange={(e) => setSupportTopic(e.target.value)}
              required
            />
            <Input
              placeholder={t("account.describeIssue")}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              required
            />
            <Button type="submit" className="rounded-full">{t("account.submitTicket")}</Button>
            <div className="pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
              <p>{t("account.faq1")}</p>
              <p>{t("account.faq2")}</p>
              <p>{t("account.faq3")}</p>
            </div>
            <div className="space-y-2 pt-2">
              {supportTickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{ticket.topic}</p>
                    <span className="capitalize text-muted-foreground">{ticket.status}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{ticket.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDateTime(ticket.createdAt)}</p>
                </div>
              ))}
              {supportTickets.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("account.noTickets")}</p>
              )}
            </div>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">{t("account.liveChat")}</h2>
            <div className="h-44 overflow-y-auto border border-border rounded-lg p-3 space-y-2 mb-3 bg-muted/20">
              {chatMessages.map((message, idx) => (
                <p key={idx} className={message.role === "user" ? "text-right text-sm" : "text-sm text-muted-foreground"}>
                  {message.text}
                </p>
              ))}
            </div>
            <form onSubmit={handleChatSend} className="flex gap-2">
              <Input
                placeholder={t("account.typeMessage")}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <Button type="submit">{t("account.send")}</Button>
            </form>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <h2 className="font-display text-2xl font-semibold mb-4">{t("account.returnsPortal")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("account.returnsBody")}
          </p>
          <form onSubmit={handleReturnRequest} className="grid md:grid-cols-4 gap-3">
            <Input
              type="number"
              placeholder={t("account.orderId")}
              value={returnOrderId}
              onChange={(e) => setReturnOrderId(e.target.value)}
              required
            />
            <Input
              placeholder={t("account.reason")}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={returnResolution}
              onChange={(e) => setReturnResolution(e.target.value)}
            >
              <option value="refund">Refund</option>
              <option value="exchange">Exchange</option>
              <option value="store_credit">Store credit</option>
            </select>
            <Button type="submit" className="rounded-full">{t("account.requestReturn")}</Button>
          </form>
          <div className="space-y-3 mt-5">
            {returnsHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.noReturns")}</p>
            ) : (
              returnsHistory.map((row) => (
                <div key={row.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-medium">{t("account.returnForOrder", { id: row.id, orderId: row.orderId })}</p>
                    <span className="capitalize text-muted-foreground">{row.status}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{row.reason}</p>
                  {row.resolution && (
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      Resolution: {row.resolution.replace("_", " ")}
                    </p>
                  )}
                  {row.refundAmount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Refund amount: {row.refundCurrency || "USD"} {row.refundAmount}
                    </p>
                  )}
                  {row.adminNote && (
                    <p className="text-xs text-muted-foreground mt-1">{row.adminNote}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{formatDateTime(row.createdAt)}</p>
                  {row.timeline && row.timeline.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {row.timeline.map((event) => (
                        <div key={event.id} className="rounded-lg bg-muted/20 px-3 py-2">
                          <p className="font-medium capitalize">{event.status}</p>
                          {event.note && <p className="text-muted-foreground">{event.note}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(event.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
