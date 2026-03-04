import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

const ABANDONED_MS = 30 * 60 * 1000;

export function useAbandonedCartWatcher() {
  const { items, lastUpdatedAt } = useCart();
  const { user } = useAuth();
  const sentRef = useRef(false);

  useEffect(() => {
    if (items.length === 0) {
      sentRef.current = false;
      return;
    }

    const timer = setInterval(() => {
      const idleMs = Date.now() - lastUpdatedAt;
      if (idleMs < ABANDONED_MS || sentRef.current) return;

      fetch("/api/cart/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
          })),
        }),
      }).catch(() => undefined);

      sentRef.current = true;
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [items, lastUpdatedAt, user?.email]);
}
