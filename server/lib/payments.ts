import crypto from "node:crypto";
import type { Request } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { paymentSessions } from "@shared/schema";
import { db } from "../db";

export type OnlinePaymentMethod = "card" | "paypal" | "momo";
export type PaymentProvider = "demo" | "paypal";
export type PaymentSessionStatus = "created" | "approved" | "captured" | "failed" | "expired";

export type PaymentSession = {
  token: string;
  orderId: number;
  orderNumber: string;
  amount: number;
  currencyCode: string;
  method: OnlinePaymentMethod;
  provider: PaymentProvider;
  providerOrderId: string | null;
  approvalUrl: string | null;
  status: PaymentSessionStatus;
  expiresAt: number;
};

const PAYMENT_TTL_MS = 30 * 60 * 1000;

function createPaymentToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

function fromRecord(record: typeof paymentSessions.$inferSelect): PaymentSession {
  return {
    token: record.token,
    orderId: record.orderId,
    orderNumber: record.orderNumber,
    amount: Number(record.amount),
    currencyCode: record.currencyCode,
    method: record.method as OnlinePaymentMethod,
    provider: record.provider as PaymentProvider,
    providerOrderId: record.providerOrderId,
    approvalUrl: record.approvalUrl,
    status: record.status as PaymentSessionStatus,
    expiresAt: new Date(record.expiresAt).getTime(),
  };
}

async function syncExpiredStatus(session: PaymentSession): Promise<PaymentSession> {
  if (session.expiresAt > Date.now() || session.status !== "created") {
    return session;
  }

  await db
    .update(paymentSessions)
    .set({ status: "expired" })
    .where(eq(paymentSessions.token, session.token));

  return {
    ...session,
    status: "expired",
  };
}

async function updateSessionStatus(token: string, status: PaymentSessionStatus) {
  await db
    .update(paymentSessions)
    .set({ status })
    .where(eq(paymentSessions.token, token));
}

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;

  const payload = (await res.json()) as { access_token?: string };
  return payload.access_token || null;
}

function getBaseUrl(req: Request): string {
  const configured = process.env.APP_URL || process.env.PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const proto = (req.headers["x-forwarded-proto"] as string | undefined) || req.protocol || "http";
  const host = req.get("host");
  return `${proto}://${host}`;
}

export function isOnlinePaymentMethod(method: string | undefined): method is OnlinePaymentMethod {
  return method === "card" || method === "paypal" || method === "momo";
}

function toSessionView(session: PaymentSession) {
  return {
    orderId: session.orderId,
    orderNumber: session.orderNumber,
    amount: session.amount,
    currencyCode: session.currencyCode,
    method: session.method,
    provider: session.provider,
    status: session.status,
    approvalUrl: session.approvalUrl,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

export async function createPaymentSession(args: {
  req: Request;
  orderId: number;
  orderNumber: string;
  amount: number;
  method: OnlinePaymentMethod;
  currencyCode?: string;
}) {
  const token = createPaymentToken();
  const expiresAt = Date.now() + PAYMENT_TTL_MS;
  const currencyCode = args.currencyCode || "USD";
  const baseUrl = getBaseUrl(args.req);
  const callbackUrl = `${baseUrl}/checkout/payment/${args.orderId}?payment_session=${encodeURIComponent(token)}`;

  let provider: PaymentProvider = "demo";
  let providerOrderId: string | null = `demo-${args.orderId}-${token.slice(0, 8)}`;
  let approvalUrl: string | null = null;

  if (args.method === "paypal") {
    const accessToken = await getPayPalAccessToken();
    if (accessToken) {
      const res = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: args.orderNumber,
              amount: {
                currency_code: currencyCode,
                value: args.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: callbackUrl,
            cancel_url: `${callbackUrl}&action=fail`,
            user_action: "PAY_NOW",
          },
        }),
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          id?: string;
          links?: Array<{ rel?: string; href?: string }>;
        };
        provider = "paypal";
        providerOrderId = payload.id || providerOrderId;
        approvalUrl = payload.links?.find((link) => link.rel === "approve")?.href || null;
      }
    }
  }

  const session: PaymentSession = {
    token,
    orderId: args.orderId,
    orderNumber: args.orderNumber,
    amount: args.amount,
    currencyCode,
    method: args.method,
    provider,
    providerOrderId,
    approvalUrl,
    status: "created",
    expiresAt,
  };

  await db.insert(paymentSessions).values({
    token: session.token,
    orderId: session.orderId,
    orderNumber: session.orderNumber,
    amount: session.amount.toFixed(2),
    currencyCode: session.currencyCode,
    method: session.method,
    provider: session.provider,
    providerOrderId: session.providerOrderId,
    approvalUrl: session.approvalUrl,
    status: session.status,
    expiresAt: new Date(session.expiresAt),
  });

  return {
    session,
    view: toSessionView(session),
    checkoutUrl: callbackUrl,
  };
}

export async function getPaymentSession(token: string | null | undefined): Promise<PaymentSession | null> {
  if (!token) return null;
  const [record] = await db.select().from(paymentSessions).where(eq(paymentSessions.token, token)).limit(1);
  if (!record) return null;
  return syncExpiredStatus(fromRecord(record));
}

export async function getPaymentSessionByProviderOrderId(
  provider: PaymentProvider,
  providerOrderId: string | null | undefined,
): Promise<PaymentSession | null> {
  if (!providerOrderId) return null;

  const [record] = await db
    .select()
    .from(paymentSessions)
    .where(and(eq(paymentSessions.provider, provider), eq(paymentSessions.providerOrderId, providerOrderId)))
    .limit(1);

  if (!record) return null;
  return syncExpiredStatus(fromRecord(record));
}

export async function getLatestActivePaymentSessionForOrder(orderId: number): Promise<PaymentSession | null> {
  const records = await db
    .select()
    .from(paymentSessions)
    .where(and(eq(paymentSessions.orderId, orderId), inArray(paymentSessions.status, ["created", "approved"])))
    .orderBy(desc(paymentSessions.createdAt));

  for (const record of records) {
    const session = await syncExpiredStatus(fromRecord(record));
    if (session.status === "created" || session.status === "approved") {
      return session;
    }
  }

  return null;
}

export async function getPaymentSessionView(token: string | null | undefined) {
  const session = await getPaymentSession(token);
  return session ? toSessionView(session) : null;
}

export async function capturePaymentSession(session: PaymentSession, payerId?: string, providerToken?: string) {
  if (session.expiresAt <= Date.now()) {
    await updateSessionStatus(session.token, "expired");
    throw new Error("Payment session expired");
  }

  if (session.provider === "paypal" && session.providerOrderId) {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      throw new Error("PayPal is not configured");
    }
    if (providerToken && providerToken !== session.providerOrderId) {
      throw new Error("Payment token mismatch");
    }

    const res = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${session.providerOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(payerId ? { "PayPal-Client-Metadata-Id": payerId } : {}),
      },
    });

    if (!res.ok) {
      await updateSessionStatus(session.token, "failed");
      throw new Error("PayPal capture failed");
    }
  }

  await updateSessionStatus(session.token, "captured");
}

export async function failPaymentSession(session: PaymentSession) {
  await updateSessionStatus(session.token, "failed");
}

export async function verifyPayPalWebhook(args: {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const accessToken = await getPayPalAccessToken();
  if (!webhookId || !accessToken) return false;

  const transmissionId = typeof args.headers["paypal-transmission-id"] === "string" ? args.headers["paypal-transmission-id"] : "";
  const transmissionTime = typeof args.headers["paypal-transmission-time"] === "string" ? args.headers["paypal-transmission-time"] : "";
  const certUrl = typeof args.headers["paypal-cert-url"] === "string" ? args.headers["paypal-cert-url"] : "";
  const authAlgo = typeof args.headers["paypal-auth-algo"] === "string" ? args.headers["paypal-auth-algo"] : "";
  const transmissionSig = typeof args.headers["paypal-transmission-sig"] === "string" ? args.headers["paypal-transmission-sig"] : "";

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const res = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: JSON.parse(args.rawBody.toString("utf8")),
    }),
  });
  if (!res.ok) return false;

  const payload = (await res.json()) as { verification_status?: string };
  return payload.verification_status === "SUCCESS";
}

export function verifyDemoWebhook(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.DEMO_WEBHOOK_SECRET || process.env.JWT_SECRET || "dev-demo-webhook-secret";
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
