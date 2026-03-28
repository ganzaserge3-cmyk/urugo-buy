import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type CheckoutQuoteInput, type CreateOrderInput } from "@shared/routes";
import { getOrderAccessHeaders } from "@/lib/order-access";

export function useCheckoutQuote(input: CheckoutQuoteInput, enabled = true) {
  return useQuery({
    queryKey: [api.checkout.quote.path, input],
    queryFn: async () => {
      const validated = api.checkout.quote.input.parse(input);
      const res = await fetch(api.checkout.quote.path, {
        method: api.checkout.quote.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Failed to fetch quote" }));
        throw new Error(payload.message || "Failed to fetch quote");
      }

      return api.checkout.quote.responses[200].parse(await res.json());
    },
    enabled,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderInput) => {
      const validated = api.orders.create.input.parse(payload);
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Order creation failed" }));
        throw new Error(errorBody.message || "Order creation failed");
      }

      return api.orders.create.responses[201].parse(await res.json());
    },
  });
}

export function useOrder(orderId: number) {
  return useQuery({
    queryKey: [api.orders.get.path, orderId],
    queryFn: async () => {
      const url = api.orders.get.path.replace(":id", String(orderId));
      const res = await fetch(url, {
        headers: getOrderAccessHeaders(orderId),
      });

      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to load order");
      }

      return api.orders.get.responses[200].parse(await res.json());
    },
    enabled: Number.isFinite(orderId) && orderId > 0,
  });
}

export function useOrderTracking(orderId: number) {
  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/tracking`, {
        headers: getOrderAccessHeaders(orderId),
      });
      if (!res.ok) throw new Error("Failed to load tracking");
      return res.json();
    },
    enabled: Number.isFinite(orderId) && orderId > 0,
    refetchInterval: 15000,
  });
}

export function usePaymentSession(orderId: number, sessionToken: string | null) {
  return useQuery({
    queryKey: [api.payments.session.path, orderId, sessionToken],
    queryFn: async () => {
      const url = `${api.payments.session.path.replace(":orderId", String(orderId))}?paymentSession=${encodeURIComponent(sessionToken || "")}`;
      const res = await fetch(url);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to load payment session");
      }
      return api.payments.session.responses[200].parse(await res.json());
    },
    enabled: Number.isFinite(orderId) && orderId > 0 && Boolean(sessionToken),
    refetchInterval: 10000,
  });
}

export function useResumePayment(orderId: number, enabled = true) {
  return useQuery({
    queryKey: [api.payments.resume.path, orderId],
    queryFn: async () => {
      const url = api.payments.resume.path.replace(":orderId", String(orderId));
      const res = await fetch(url, {
        headers: getOrderAccessHeaders(orderId),
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to load payment recovery link");
      }
      return api.payments.resume.responses[200].parse(await res.json());
    },
    enabled: enabled && Number.isFinite(orderId) && orderId > 0,
    refetchInterval: 10000,
  });
}

export function useConfirmPayment(orderId: number) {
  return useMutation({
    mutationFn: async (payload: {
      sessionToken: string;
      action?: "confirm" | "fail";
      payerId?: string;
      providerToken?: string;
    }) => {
      const validated = api.payments.confirm.input.parse(payload);
      const url = api.payments.confirm.path.replace(":orderId", String(orderId));
      const res = await fetch(url, {
        method: api.payments.confirm.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Payment confirmation failed" }));
        throw new Error(errorBody.message || "Payment confirmation failed");
      }

      return api.payments.confirm.responses[200].parse(await res.json());
    },
  });
}

export function useRestartPayment(orderId: number) {
  return useMutation({
    mutationFn: async () => {
      const url = api.payments.restart.path.replace(":orderId", String(orderId));
      const res = await fetch(url, {
        method: api.payments.restart.method,
        headers: getOrderAccessHeaders(orderId),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Failed to start a new payment session" }));
        throw new Error(errorBody.message || "Failed to start a new payment session");
      }

      return api.payments.restart.responses[200].parse(await res.json());
    },
  });
}
