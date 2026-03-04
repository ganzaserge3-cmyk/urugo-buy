import { useMutation, useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export type AccountPreferences = {
  priceDropAlerts: boolean;
  stockAlerts: boolean;
  essentialsSubscription: boolean;
  twoFactorEnabled: boolean;
};

export function useAccountSummary() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["account-summary"],
    queryFn: async () => {
      const res = await authFetch("/api/account/summary");
      if (!res.ok) throw new Error("Failed to load account summary");
      return res.json() as Promise<{
        totalSpend: number;
        loyaltyPoints: number;
        tier: "Bronze" | "Silver" | "Gold";
        referralCode: string;
        referralsCount: number;
        referralBonusPoints: number;
      }>;
    },
    enabled: !!token,
  });
}

export function useAccountAlertsFeed() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["account-alerts-feed"],
    queryFn: async () => {
      const res = await authFetch("/api/account/alerts/feed");
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json() as Promise<Array<{
        type: "price-drop" | "restock";
        productId: number;
        productName: string;
        message: string;
      }>>;
    },
    enabled: !!token,
  });
}

export function useWatchProductAlert() {
  return useMutation({
    mutationFn: async (payload: {
      productId: number;
      targetPrice?: number;
      notifyOnPriceDrop?: boolean;
      notifyOnRestock?: boolean;
    }) => {
      const res = await authFetch("/api/account/product-alerts/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create alert" }));
        throw new Error(err.message || "Failed to create alert");
      }
      return res.json();
    },
  });
}

export function useRedeemReferralCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await authFetch("/api/account/referrals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to redeem referral code" }));
        throw new Error(err.message || "Failed to redeem referral code");
      }
      return res.json() as Promise<{ awardedPoints: number; message: string }>;
    },
  });
}

export function useAccountOrders() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["account-orders"],
    queryFn: async () => {
      const res = await authFetch("/api/account/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json() as Promise<Array<{
        id: number;
        orderNumber: string;
        total: string;
        status: string;
        createdAt: string;
      }>>;
    },
    enabled: !!token,
  });
}

export function useAccountPreferences() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["account-preferences"],
    queryFn: async () => {
      const res = await authFetch("/api/account/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      return res.json() as Promise<AccountPreferences>;
    },
    enabled: !!token,
  });
}

export function useSaveAccountPreferences() {
  return useMutation({
    mutationFn: async (payload: AccountPreferences) => {
      const res = await authFetch("/api/account/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to save preferences" }));
        throw new Error(err.message || "Failed to save preferences");
      }
      return res.json();
    },
  });
}
