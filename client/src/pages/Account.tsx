import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
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
import { useCreateWishlistShare } from "@/hooks/use-wishlist";

const defaultPreferences: AccountPreferences = {
  priceDropAlerts: true,
  stockAlerts: true,
  essentialsSubscription: false,
  twoFactorEnabled: false,
};

export default function Account() {
  useSeo("My Account - UrugoBuy", "Manage loyalty, referrals, alerts, returns, support, and security settings.");
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: summary, refetch: refetchSummary } = useAccountSummary();
  const { data: orders = [], refetch: refetchOrders } = useAccountOrders();
  const { data: alertsFeed = [] } = useAccountAlertsFeed();
  const { data: preferences } = useAccountPreferences();
  const savePreferences = useSaveAccountPreferences();
  const redeemReferral = useRedeemReferralCode();
  const createWishlistShare = useCreateWishlistShare();

  const [localPrefs, setLocalPrefs] = useState<AccountPreferences>(defaultPreferences);
  const [supportTopic, setSupportTopic] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "Hi. How can I help with your order today?" },
  ]);
  const [wishlistShareLink, setWishlistShareLink] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: number; frequency: string; status: string; nextRunAt?: string }>>([]);

  useEffect(() => {
    if (preferences) setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    authFetch("/api/subscriptions")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setSubscriptions(Array.isArray(rows) ? rows : []))
      .catch(() => setSubscriptions([]));
  }, []);

  const siteBaseUrl = useMemo(() => {
    return typeof window !== "undefined" ? window.location.origin : "";
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto border border-border rounded-2xl p-8 text-center bg-card">
          <h1 className="font-display text-4xl font-bold mb-3">Sign in to access your account</h1>
          <p className="text-muted-foreground mb-6">Manage loyalty, alerts, reorders, and support from one place.</p>
          <Button asChild className="rounded-full">
            <Link href="/login">Go to Login</Link>
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
          title: "2FA verification required",
          description: "Send and verify your 2FA code before saving.",
        });
        return;
      }
      await savePreferences.mutateAsync(localPrefs);
      toast({ title: "Preferences saved" });
      await refetchSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleReorder = async (orderId: number) => {
    const res = await authFetch(`/api/account/reorder/${orderId}`, { method: "POST" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Reorder failed" }));
      toast({ variant: "destructive", title: "Reorder failed", description: payload.message });
      return;
    }
    toast({ title: "Reorder created", description: "A new order was created from this order." });
    await refetchOrders();
    await refetchSummary();
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: supportTopic, message: supportMessage }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Failed to submit ticket" }));
      toast({ variant: "destructive", title: "Ticket failed", description: payload.message });
      return;
    }
    setSupportTopic("");
    setSupportMessage("");
    toast({ title: "Support ticket submitted" });
  };

  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = Number(returnOrderId);
    const res = await authFetch("/api/returns/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: returnReason }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Return request failed" }));
      toast({ variant: "destructive", title: "Return failed", description: payload.message });
      return;
    }
    setReturnOrderId("");
    setReturnReason("");
    toast({ title: "Return request submitted" });
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const next = chatText.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: next }]);
    setChatText("");
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", text: "Thanks. Our support team will follow up in your ticket inbox shortly." },
      ]);
    }, 350);
  };

  const handleGenerateWishlistShare = async () => {
    try {
      const payload = await createWishlistShare.mutateAsync();
      setWishlistShareLink(`${siteBaseUrl}/wishlist/${payload.token}`);
      toast({ title: "Share link generated", description: `Valid until ${new Date(payload.expiresAt).toLocaleString()}` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share link failed",
        description: error instanceof Error ? error.message : "Try again",
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
      const payload = await res.json().catch(() => ({ message: "Failed to send code" }));
      toast({ variant: "destructive", title: "2FA send failed", description: payload.message });
      return;
    }
    const payload = await res.json();
    const debugCode = payload.debugCode ? ` (Dev code: ${payload.debugCode})` : "";
    toast({ title: "2FA code sent", description: `Check your email for the code.${debugCode}` });
  };

  const handleVerifyTwoFactor = async () => {
    const res = await authFetch("/api/account/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "settings", code: twoFactorCode }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Verification failed" }));
      toast({ variant: "destructive", title: "2FA verification failed", description: payload.message });
      setTwoFactorVerified(false);
      return;
    }
    setTwoFactorVerified(true);
    toast({ title: "2FA verified" });
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
      toast({ title: "Subscription created" });
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
    if (res.ok) toast({ title: "Push notifications enabled" });
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
      toast({ title: "Next subscription run skipped" });
    }
  };

  const handleRedeemReferral = async () => {
    if (!referralInput.trim()) return;
    try {
      const payload = await redeemReferral.mutateAsync(referralInput.trim());
      toast({ title: "Referral redeemed", description: `+${payload.awardedPoints} points awarded.` });
      setReferralInput("");
      await refetchSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Referral failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold">My Account Hub</h1>
          <p className="text-muted-foreground">Loyalty, referrals, reorder, subscriptions, returns, support, and security.</p>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Loyalty Points</p>
            <p className="text-2xl font-bold">{summary?.loyaltyPoints ?? 0}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Tier</p>
            <p className="text-2xl font-bold">{summary?.tier ?? "Bronze"}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Lifetime Spend</p>
            <p className="text-2xl font-bold">${(summary?.totalSpend ?? 0).toFixed(2)}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Referral Code</p>
            <p className="text-xl font-bold">{summary?.referralCode ?? "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.referralsCount ?? 0} redeemed
            </p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Referral Rewards</h2>
            <p className="text-sm text-muted-foreground">
              Redeem a friend's code to earn bonus points once per account.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
              />
              <Button onClick={handleRedeemReferral} disabled={redeemReferral.isPending}>
                Redeem
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bonus points earned: {summary?.referralBonusPoints ?? 0}
            </p>
          </div>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">My Alert Feed</h2>
            {alertsFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No price-drop or restock alerts yet.</p>
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
            <h2 className="font-display text-2xl font-semibold">Alerts, Subscription, Security</h2>
            <label className="flex items-center justify-between">
              <span>Price drop alerts</span>
              <input
                type="checkbox"
                checked={localPrefs.priceDropAlerts}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, priceDropAlerts: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Back-in-stock alerts</span>
              <input
                type="checkbox"
                checked={localPrefs.stockAlerts}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, stockAlerts: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Weekly essentials subscription</span>
              <input
                type="checkbox"
                checked={localPrefs.essentialsSubscription}
                onChange={(e) => setLocalPrefs((prev) => ({ ...prev, essentialsSubscription: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Two-factor authentication</span>
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
                    Send Code
                  </Button>
                  <Input
                    placeholder="6-digit code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                  <Button type="button" onClick={handleVerifyTwoFactor}>Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: {twoFactorVerified ? "Verified" : "Not verified"}
                </p>
              </div>
            )}
            <Button className="rounded-full" onClick={handleSavePreferences} disabled={savePreferences.isPending}>
              Save Preferences
            </Button>
          </div>

          <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
            <h2 className="font-display text-2xl font-semibold">Wishlist Sharing</h2>
            <p className="text-sm text-muted-foreground">Share this link so others can browse your favorite picks.</p>
            <Input value={wishlistShareLink} readOnly placeholder="Generate a secure share link" />
            <Button className="rounded-full" onClick={handleGenerateWishlistShare} disabled={createWishlistShare.isPending}>
              Generate Link
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                if (!wishlistShareLink) return;
                await navigator.clipboard.writeText(wishlistShareLink);
                toast({ title: "Wishlist link copied" });
              }}
              disabled={!wishlistShareLink}
            >
              Copy Share Link
            </Button>
            <Button variant="outline" className="rounded-full" onClick={registerPush}>
              Enable Push Notifications
            </Button>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">Subscriptions</h2>
            <Button onClick={createSubscription} className="rounded-full">New Subscription</Button>
          </div>
          <div className="space-y-2">
            {subscriptions.length === 0 ? (
              <p className="text-muted-foreground">No active subscriptions.</p>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="border border-border rounded-lg p-3 flex items-center justify-between text-sm">
                  <span>#{sub.id} - {sub.frequency} - {sub.status}{sub.nextRunAt ? ` - next ${new Date(sub.nextRunAt).toLocaleDateString()}` : ""}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => skipSubscriptionNext(sub.id)}>Skip Next</Button>
                    <Button size="sm" variant="outline" onClick={() => updateSubscription(sub.id, "paused")}>Pause</Button>
                    <Button size="sm" variant="outline" onClick={() => updateSubscription(sub.id, "active")}>Resume</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateSubscription(sub.id, "cancelled")}>Cancel</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <h2 className="font-display text-2xl font-semibold mb-4">Order History and Reorder</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders found yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="grid grid-cols-12 gap-2 border-b border-border pb-3 text-sm">
                  <span className="col-span-3">{order.orderNumber}</span>
                  <span className="col-span-3 capitalize">{order.status}</span>
                  <span className="col-span-2">${Number(order.total).toFixed(2)}</span>
                  <span className="col-span-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReorder(order.id)}>Reorder</Button>
                    <Button size="sm" asChild>
                      <Link href={`/order-success/${order.id}`}>Invoice</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateSupportTicket} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Support Ticket</h2>
            <Input
              placeholder="Topic"
              value={supportTopic}
              onChange={(e) => setSupportTopic(e.target.value)}
              required
            />
            <Input
              placeholder="Describe your issue"
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              required
            />
            <Button type="submit" className="rounded-full">Submit Ticket</Button>
            <div className="pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
              <p>FAQ: Delivery times are shown during checkout.</p>
              <p>FAQ: Refunds are processed within 3-5 business days.</p>
              <p>FAQ: Track order progress from your order success page.</p>
            </div>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">Live Chat</h2>
            <div className="h-44 overflow-y-auto border border-border rounded-lg p-3 space-y-2 mb-3 bg-muted/20">
              {chatMessages.map((message, idx) => (
                <p key={idx} className={message.role === "user" ? "text-right text-sm" : "text-sm text-muted-foreground"}>
                  {message.text}
                </p>
              ))}
            </div>
            <form onSubmit={handleChatSend} className="flex gap-2">
              <Input
                placeholder="Type your message"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <h2 className="font-display text-2xl font-semibold mb-4">Returns Portal</h2>
          <form onSubmit={handleReturnRequest} className="grid md:grid-cols-3 gap-3">
            <Input
              type="number"
              placeholder="Order ID"
              value={returnOrderId}
              onChange={(e) => setReturnOrderId(e.target.value)}
              required
            />
            <Input
              placeholder="Reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
            />
            <Button type="submit" className="rounded-full">Request Return</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
