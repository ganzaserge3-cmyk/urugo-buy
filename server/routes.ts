import crypto from "node:crypto";
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { computeCouponDiscount, roundCurrency } from "./lib/pricing";
import {
  accountPreferences,
  blogPosts,
  categories,
  contentPages,
  currencyRates,
  coupons,
  notificationLogs,
  notificationSubscriptions,
  orderItems,
  orderMeta,
  orders,
  productQuestions,
  productReviews,
  promotions,
  products,
  returnStatusEvents,
  returnRequests,
  riskAssessments,
  subscriptions,
  vendors,
  supportTickets,
  twoFactorChallenges,
  wishlistShares,
  users,
  wishlists,
} from "@shared/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";

type UserRole = "customer" | "admin";

type SessionValue = {
  email: string;
  name: string;
  role: UserRole;
};

const sessions = new Map<string, SessionValue>();
const abandonedCartLog: Array<{ email?: string; itemCount: number; createdAt: string }> = [];
const firebaseSessionCache = new Map<string, { session: SessionValue; expiresAt: number }>();

const deliverySlots = [
  "Today 6:00 PM - 8:00 PM",
  "Tomorrow 9:00 AM - 12:00 PM",
  "Tomorrow 2:00 PM - 5:00 PM",
  "Tomorrow 6:00 PM - 9:00 PM",
];

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function createToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function createOtpCode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function hashOtpCode(code: string): string {
  const secret = process.env.TWO_FACTOR_SECRET || "dev-two-factor-secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

async function sendTwoFactorEmail(to: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your UrugoBuy verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    }),
  });
  return res.ok;
}

async function sendSmsOrWhatsApp(to: string, message: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to) return false;

  const body = new URLSearchParams();
  body.set("From", from);
  body.set("To", to);
  body.set("Body", message);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  return res.ok;
}

function buildRiskScore(args: { amount: number; recentOrders: number; failedPayments: number }): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (args.amount >= 300) {
    score += 25;
    reasons.push("high_order_amount");
  }
  if (args.recentOrders >= 3) {
    score += 35;
    reasons.push("high_velocity_orders");
  }
  if (args.failedPayments >= 1) {
    score += 30;
    reasons.push("recent_payment_failures");
  }
  return { score: Math.min(100, score), reasons };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function getToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  const alt = req.headers["x-auth-token"];
  return typeof alt === "string" ? alt : null;
}

async function verifyFirebaseIdToken(idToken: string): Promise<SessionValue | null> {
  const cached = firebaseSessionCache.get(idToken);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.session;
  }

  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;

  const payload = await res.json() as { users?: Array<{ email?: string; displayName?: string }> };
  const u = payload.users?.[0];
  if (!u?.email) return null;

  const session: SessionValue = {
    email: u.email,
    name: u.displayName || u.email.split("@")[0] || "Customer",
    role: "customer",
  };
  firebaseSessionCache.set(idToken, { session, expiresAt: now + 5 * 60 * 1000 });
  return session;
}

async function getSession(req: Request): Promise<SessionValue | null> {
  const token = getToken(req);
  if (!token) return null;
  if (token.startsWith("firebase-id:")) {
    const idToken = token.slice("firebase-id:".length).trim();
    if (!idToken) return null;
    return verifyFirebaseIdToken(idToken);
  }
  return sessions.get(token) || null;
}

async function requireAuth(req: Request) {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireAdmin(req: Request) {
  const session = await requireAuth(req);
  if (session.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

function createRateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= limit) {
      return res.status(429).json({ message: "Too many requests. Please try again shortly." });
    }
    bucket.count += 1;
    return next();
  };
}

async function computeDiscount(couponCode: string | undefined, subtotal: number) {
  if (!couponCode) {
    return { discount: 0, coupon: null as null | { code: string; discountType: string } };
  }

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(sql`LOWER(${coupons.code}) = ${couponCode.toLowerCase()}`, eq(coupons.active, true)))
    .limit(1);

  if (!coupon || Number(coupon.minSpend) > subtotal) {
    return { discount: 0, coupon: null };
  }

  return {
    discount: computeCouponDiscount(subtotal, {
      discountType: coupon.discountType,
      value: Number(coupon.value),
    }),
    coupon: { code: coupon.code, discountType: coupon.discountType },
  };
}

async function ensureDefaultAdminUser() {
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${"admin@urugobuy.com"}`)
    .limit(1);

  if (!existing) {
    await db.insert(users).values({
      name: "Admin",
      email: "admin@urugobuy.com",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    });
  }
}

function verifyStripeSignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((segment) => {
      const [k, v] = segment.split("=");
      return [k, v];
    }),
  );

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const payload = `${t}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await ensureDefaultAdminUser();

  app.use("/api/auth", createRateLimiter(20, 15 * 60 * 1000));
  app.use("/api/checkout/quote", createRateLimiter(60, 15 * 60 * 1000));
  app.use("/api/orders", createRateLimiter(40, 15 * 60 * 1000));

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const [existing] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${input.email.toLowerCase()}`)
        .limit(1);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const [created] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash: hashPassword(input.password),
        role: "customer",
      }).returning();

      const token = createToken();
      sessions.set(token, { email: created.email, name: created.name, role: created.role as UserRole });
      return res.status(201).json({
        token,
        user: { name: created.name, email: created.email, role: created.role },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${input.email.toLowerCase()}`)
        .limit(1);
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = createToken();
      sessions.set(token, { email: user.email, name: user.name, role: user.role as UserRole });
      return res.json({
        token,
        user: { name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ user: session });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = getToken(req);
    if (token) sessions.delete(token);
    return res.json({ ok: true });
  });

  app.get(api.categories.list.path, async (_req, res) => {
    try {
      const categoriesList = await storage.getCategories();
      res.json(categoriesList);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.products.list.path, async (req, res) => {
    try {
      const input = api.products.list.input?.parse(req.query) || {};
      const productsList = await storage.getProducts(input);
      res.json(productsList);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/content/pages/:slug", async (req, res) => {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(and(eq(contentPages.slug, req.params.slug), eq(contentPages.published, true)))
      .limit(1);
    if (!page) return res.status(404).json({ message: "Page not found" });
    return res.json(page);
  });

  app.get("/api/blog/posts", async (_req, res) => {
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt));
    return res.json(rows);
  });

  app.get("/api/blog/posts/:slug", async (req, res) => {
    const [row] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, req.params.slug), eq(blogPosts.published, true)))
      .limit(1);
    if (!row) return res.status(404).json({ message: "Post not found" });
    return res.json(row);
  });

  app.get("/api/currency/rates", async (_req, res) => {
    const rows = await db.select().from(currencyRates);
    return res.json(rows);
  });

  app.get("/api/tax/estimate", async (req, res) => {
    const country = typeof req.query.country === "string" ? req.query.country.toUpperCase() : "USA";
    const subtotal = Number(req.query.subtotal || 0);
    const table: Record<string, number> = { USA: 0.08, UK: 0.2, DE: 0.19, FR: 0.2 };
    const rate = table[country] ?? 0.08;
    return res.json({ country, rate, tax: roundCurrency(subtotal * rate) });
  });

  app.get("/api/search/suggest", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (!q) return res.json([]);
      const rows = await db
        .select({
          id: products.id,
          name: products.name,
        })
        .from(products)
        .where(ilike(products.name, `%${q}%`))
        .orderBy(desc(products.rating), asc(products.name))
        .limit(8);
      return res.json(rows);
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/recommendations/:productId", async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      if (!Number.isFinite(productId) || productId <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const [current] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!current) return res.status(404).json({ message: "Product not found" });

      const related = current.categoryId === null
        ? []
        : await db
          .select()
          .from(products)
          .where(and(eq(products.categoryId, current.categoryId), sql`${products.id} <> ${productId}`))
          .orderBy(desc(products.rating), desc(products.isFeatured), asc(products.price))
          .limit(6);

      if (related.length > 0) return res.json(related);

      const fallback = await db
        .select()
        .from(products)
        .where(sql`${products.id} <> ${productId}`)
        .orderBy(desc(products.rating), desc(products.isFeatured), asc(products.price))
        .limit(6);
      return res.json(fallback);
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/compare", async (req, res) => {
    try {
      const idsRaw = typeof req.query.ids === "string" ? req.query.ids : "";
      const ids = idsRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
        .slice(0, 4);
      if (ids.length < 2) return res.status(400).json({ message: "Select at least 2 products to compare" });
      const rows = await db.select().from(products).where(inArray(products.id, ids));
      return res.json(rows);
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reviews/:productId", async (req, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const rows = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.id));
    return res.json(rows);
  });

  app.post("/api/reviews/:productId", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const productId = Number(req.params.productId);
      const input = z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().min(3).max(500),
        photoUrl: z.string().url().optional(),
      }).parse(req.body);

      const [review] = await db.insert(productReviews).values({
        productId,
        userEmail: session.email,
        rating: input.rating.toFixed(1),
        comment: input.comment,
        photoUrl: input.photoUrl,
      }).returning();
      return res.status(201).json(review);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:productId/questions", async (req, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const rows = await db
      .select()
      .from(productQuestions)
      .where(eq(productQuestions.productId, productId))
      .orderBy(desc(productQuestions.id));
    return res.json(rows);
  });

  app.post("/api/products/:productId/questions", async (req, res) => {
    try {
      const session = await getSession(req);
      const productId = Number(req.params.productId);
      const input = z.object({ question: z.string().min(5).max(500) }).parse(req.body);
      const [row] = await db
        .insert(productQuestions)
        .values({
          productId,
          userEmail: session?.email || null,
          question: input.question,
        })
        .returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/questions/:id/answer", async (req, res) => {
    try {
      const session = await requireAdmin(req);
      const id = Number(req.params.id);
      const input = z.object({ answer: z.string().min(2).max(1000) }).parse(req.body);
      const [row] = await db
        .update(productQuestions)
        .set({
          answer: input.answer,
          answeredBy: session.email,
          answeredAt: new Date(),
        })
        .where(eq(productQuestions.id, id))
        .returning();
      if (!row) return res.status(404).json({ message: "Question not found" });
      return res.json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/wishlist", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const rows = await db.select().from(wishlists).where(eq(wishlists.userEmail, session.email));
      const ids = rows.map((r) => r.productId);
      if (ids.length === 0) return res.json([]);
      const wishlistProducts = await db.select().from(products).where(inArray(products.id, ids));
      return res.json(wishlistProducts);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/wishlist/:productId", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const productId = Number(req.params.productId);
      const existing = await db.select().from(wishlists).where(and(eq(wishlists.userEmail, session.email), eq(wishlists.productId, productId))).limit(1);
      if (existing.length === 0) {
        await db.insert(wishlists).values({ userEmail: session.email, productId });
      }
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const productId = Number(req.params.productId);
      await db.delete(wishlists).where(and(eq(wishlists.userEmail, session.email), eq(wishlists.productId, productId)));
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const input = z.object({
        code: z.string().min(2),
        subtotal: z.number().nonnegative(),
      }).parse(req.body);

      const { coupon, discount } = await computeDiscount(input.code, input.subtotal);
      if (!coupon) {
        return res.status(400).json({ message: "Invalid or ineligible coupon" });
      }

      return res.json({
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/delivery-slots", async (_req, res) => {
    return res.json(deliverySlots);
  });

  app.post("/api/cart/abandoned", async (req, res) => {
    try {
      const input = z.object({
        email: z.string().email().optional(),
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
          quantity: z.number(),
        })).default([]),
      }).parse(req.body);

      abandonedCartLog.push({
        email: input.email,
        itemCount: input.items.length,
        createdAt: new Date().toISOString(),
      });
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const input = z.object({
        amount: z.number().positive(),
        currency: z.string().default("usd"),
        orderId: z.number().int().positive().optional(),
      }).parse(req.body);

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(400).json({ message: "STRIPE_SECRET_KEY is not configured" });
      }

      const body = new URLSearchParams();
      body.set("amount", String(Math.round(input.amount * 100)));
      body.set("currency", input.currency);
      body.set("automatic_payment_methods[enabled]", "true");
      if (input.orderId) {
        body.set("metadata[orderId]", String(input.orderId));
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const payload = await stripeRes.json();
      if (!stripeRes.ok) {
        return res.status(400).json({ message: payload?.error?.message || "Failed to create payment intent" });
      }

      return res.json({
        provider: "stripe",
        paymentIntentId: payload.id,
        clientSecret: payload.client_secret,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const signature = req.headers["stripe-signature"];
      const rawBody = req.rawBody;

      if (!stripeWebhookSecret) {
        return res.status(400).json({ message: "STRIPE_WEBHOOK_SECRET is not configured" });
      }
      if (typeof signature !== "string" || !Buffer.isBuffer(rawBody)) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const valid = verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
      if (!valid) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }

      const event = JSON.parse(rawBody.toString("utf8"));
      const eventType = event.type as string | undefined;
      const intent = event?.data?.object;
      const orderId = Number(intent?.metadata?.orderId);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        return res.json({ ok: true });
      }

      if (eventType === "payment_intent.succeeded") {
        await db.update(orders).set({ status: "paid" }).where(eq(orders.id, orderId));
        await db.update(orderMeta).set({ paymentStatus: "paid" }).where(eq(orderMeta.orderId, orderId));
      } else if (eventType === "payment_intent.payment_failed") {
        await db.update(orders).set({ status: "payment_failed" }).where(eq(orders.id, orderId));
        await db.update(orderMeta).set({ paymentStatus: "failed" }).where(eq(orderMeta.orderId, orderId));
      }

      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.newsletter.subscribe.path, async (req, res) => {
    try {
      const input = api.newsletter.subscribe.input.parse(req.body);
      const existing = await storage.getSubscriberByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Already subscribed", field: "email" });
      }
      const subscriber = await storage.subscribe(input);
      res.status(201).json(subscriber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.checkout.quote.path, async (req, res) => {
    try {
      const input = api.checkout.quote.input.parse(req.body);
      const quote = await storage.getCheckoutQuote({ items: input.items });
      const { discount, coupon } = await computeDiscount(input.couponCode, quote.subtotal);
      const total = Math.max(0, roundCurrency(quote.total - discount));
      res.json({
        ...quote,
        discount,
        couponCode: coupon?.code,
        total,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      await db.insert(orderMeta).values({
        orderId: order.id,
        couponCode: input.couponCode,
        deliverySlot: input.deliverySlot,
        paymentMethod: input.paymentMethod || "card",
        paymentStatus: input.paymentMethod === "cod" ? "paid" : "pending",
      });

      await db.insert(notificationLogs).values({
        orderId: order.id,
        channel: "email",
        message: `Order ${order.orderNumber} confirmation prepared for ${input.customerEmail}`,
      });

      await sendSmsOrWhatsApp(
        process.env.TWILIO_TO || "",
        `UrugoBuy: Order ${order.orderNumber} confirmed. Total $${order.total.toFixed(2)}.`,
      ).catch(() => undefined);

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const [meta] = await db.select().from(orderMeta).where(eq(orderMeta.orderId, id)).limit(1);
      res.json({
        ...order,
        order: {
          ...order.order,
          ...(meta || {}),
        },
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id/tracking", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid order ID" });

      const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const statusOrder = ["pending", "packed", "shipped", "delivered"];
      const currentIndex = Math.max(0, statusOrder.indexOf(order.status));
      const timeline = statusOrder.map((s, idx) => ({
        status: s,
        completed: idx <= currentIndex,
      }));
      const eta = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      return res.json({ orderId: id, currentStatus: order.status, timeline, eta });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id/returns", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid order ID" });
    const rows = await db.select().from(returnRequests).where(eq(returnRequests.orderId, id)).orderBy(desc(returnRequests.id));
    if (rows.length === 0) return res.json([]);
    const events = await db
      .select()
      .from(returnStatusEvents)
      .where(inArray(returnStatusEvents.returnRequestId, rows.map((row) => row.id)))
      .orderBy(asc(returnStatusEvents.id));
    return res.json(rows.map((row) => ({
      ...row,
      timeline: events.filter((event) => event.returnRequestId === row.id),
    })));
  });

  app.get("/api/notifications/:orderId", async (req, res) => {
    try {
      const id = Number(req.params.orderId);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const logs = await db.select().from(notificationLogs).where(eq(notificationLogs.orderId, id));
      const emailMessage = `Hi ${order.order.customerName}, your order ${order.order.orderNumber} is confirmed.`;
      const smsMessage = `Order ${order.order.orderNumber} confirmed. Total $${Number(order.order.total).toFixed(2)}.`;
      return res.json({ emailMessage, smsMessage, logCount: logs.length });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/account/preferences", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const [pref] = await db
        .select()
        .from(accountPreferences)
        .where(eq(accountPreferences.userEmail, session.email))
        .limit(1);
      return res.json(pref || {
        userEmail: session.email,
        priceDropAlerts: true,
        stockAlerts: true,
        essentialsSubscription: false,
        twoFactorEnabled: false,
        updatedAt: new Date(),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/account/preferences", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const input = z.object({
        priceDropAlerts: z.boolean(),
        stockAlerts: z.boolean(),
        essentialsSubscription: z.boolean(),
        twoFactorEnabled: z.boolean(),
      }).parse(req.body);
      await db
        .insert(accountPreferences)
        .values({
          userEmail: session.email,
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: accountPreferences.userEmail,
          set: {
            ...input,
            updatedAt: new Date(),
          },
        });
      return res.json({ ok: true, preferences: input });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/account/orders", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, session.email))
        .orderBy(desc(orders.id))
        .limit(20);
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/account/2fa/start", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const input = z.object({
        purpose: z.enum(["settings", "checkout", "login"]).default("settings"),
      }).parse(req.body);
      const code = createOtpCode();
      const delivered = await sendTwoFactorEmail(session.email, code);
      await db.insert(twoFactorChallenges).values({
        userEmail: session.email,
        purpose: input.purpose,
        codeHash: hashOtpCode(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        attempts: 0,
      });

      const response: Record<string, unknown> = {
        ok: true,
        delivery: delivered ? "email" : "dev-fallback",
        expiresInSeconds: 600,
      };
      if (process.env.NODE_ENV !== "production") {
        response.debugCode = code;
      }
      return res.json(response);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/account/2fa/verify", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const input = z.object({
        purpose: z.enum(["settings", "checkout", "login"]).default("settings"),
        code: z.string().regex(/^\d{6}$/),
      }).parse(req.body);

      const [challenge] = await db
        .select()
        .from(twoFactorChallenges)
        .where(and(
          eq(twoFactorChallenges.userEmail, session.email),
          eq(twoFactorChallenges.purpose, input.purpose),
          eq(twoFactorChallenges.used, false),
        ))
        .orderBy(desc(twoFactorChallenges.id))
        .limit(1);

      if (!challenge) {
        return res.status(400).json({ message: "No active challenge" });
      }
      if (challenge.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: "Code has expired" });
      }
      if ((challenge.attempts || 0) >= 5) {
        return res.status(400).json({ message: "Too many attempts" });
      }

      const valid = challenge.codeHash === hashOtpCode(input.code);
      await db
        .update(twoFactorChallenges)
        .set({
          attempts: (challenge.attempts || 0) + 1,
          used: valid ? true : challenge.used,
        })
        .where(eq(twoFactorChallenges.id, challenge.id));

      if (!valid) return res.status(400).json({ message: "Invalid code" });
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/wishlist/share", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const token = createShareToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const [share] = await db
        .insert(wishlistShares)
        .values({
          userEmail: session.email,
          token,
          expiresAt,
        })
        .returning();
      return res.status(201).json({ token: share.token, expiresAt: share.expiresAt });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/wishlist/share/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const [share] = await db
        .select()
        .from(wishlistShares)
        .where(eq(wishlistShares.token, token))
        .limit(1);
      if (!share || share.expiresAt.getTime() < Date.now()) {
        return res.status(404).json({ message: "Share link expired or not found" });
      }
      const rows = await db.select().from(wishlists).where(eq(wishlists.userEmail, share.userEmail));
      const ids = rows.map((r) => r.productId);
      if (ids.length === 0) return res.json([]);
      const items = await db.select().from(products).where(inArray(products.id, ids));
      return res.json(items);
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/address/suggest", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (q.length < 3) return res.json([]);
      const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`;
      const upstream = await fetch(endpoint, {
        headers: {
          "User-Agent": "UrugoBuy/1.0 (address autocomplete)",
        },
      });
      if (!upstream.ok) return res.json([]);
      const data = await upstream.json() as Array<{ display_name?: string }>;
      return res.json(
        data
          .map((item) => item.display_name)
          .filter((value): value is string => typeof value === "string")
          .slice(0, 5),
      );
    } catch {
      return res.json([]);
    }
  });

  app.post("/api/notifications/subscribe", async (req, res) => {
    try {
      const session = await getSession(req);
      const input = z.object({
        endpoint: z.string().url(),
        p256dh: z.string().optional(),
        auth: z.string().optional(),
        platform: z.enum(["web", "ios", "android"]).default("web"),
      }).parse(req.body);
      const [row] = await db
        .insert(notificationSubscriptions)
        .values({
          userEmail: session?.email || null,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          platform: input.platform,
        })
        .returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checkout/risk", async (req, res) => {
    try {
      const input = z.object({
        customerEmail: z.string().email(),
        amount: z.number().nonnegative(),
      }).parse(req.body);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recentOrderAgg] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(eq(orders.customerEmail, input.customerEmail), gte(orders.createdAt, last24h)));
      const [failedAgg] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(eq(orders.customerEmail, input.customerEmail), eq(orders.status, "payment_failed")));
      const result = buildRiskScore({
        amount: input.amount,
        recentOrders: Number(recentOrderAgg?.count || 0),
        failedPayments: Number(failedAgg?.count || 0),
      });
      await db.insert(riskAssessments).values({
        customerEmail: input.customerEmail,
        ipAddress: req.ip || null,
        score: result.score,
        reasons: result.reasons,
      });
      return res.json({
        score: result.score,
        reasons: result.reasons,
        level: result.score >= 70 ? "high" : result.score >= 35 ? "medium" : "low",
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/subscriptions", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const rows = await db.select().from(subscriptions).where(eq(subscriptions.userEmail, session.email)).orderBy(desc(subscriptions.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const input = z.object({
        productId: z.number().int().positive().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
      }).parse(req.body);
      const [row] = await db
        .insert(subscriptions)
        .values({
          userEmail: session.email,
          productId: input.productId,
          frequency: input.frequency,
          status: "active",
          nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/subscriptions/:id", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const id = Number(req.params.id);
      const input = z.object({
        status: z.enum(["active", "paused", "cancelled"]).optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
        skipNext: z.boolean().optional(),
      }).parse(req.body);
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.id, id), eq(subscriptions.userEmail, session.email)))
        .limit(1);
      if (!existing) return res.status(404).json({ message: "Subscription not found" });
      const nextRunAt = input.skipNext
        ? new Date(existing.nextRunAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        : existing.nextRunAt;
      const [row] = await db
        .update(subscriptions)
        .set({
          status: input.status || existing.status,
          frequency: input.frequency || existing.frequency,
          nextRunAt,
        })
        .where(eq(subscriptions.id, id))
        .returning();
      return res.json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/account/reorder/:orderId", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const orderId = Number(req.params.orderId);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.customerEmail, session.email)))
        .limit(1);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const existingItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      if (existingItems.length === 0) {
        return res.status(400).json({ message: "Order has no items" });
      }

      const quoteInput = {
        customerName: existingOrder.customerName,
        customerEmail: existingOrder.customerEmail,
        shippingAddress: existingOrder.shippingAddress,
        city: existingOrder.city,
        country: existingOrder.country,
        items: existingItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      const newOrder = await storage.createOrder(quoteInput);
      return res.status(201).json(newOrder);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/account/summary", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const rows = await db
        .select({
          total: orders.total,
        })
        .from(orders)
        .where(eq(orders.customerEmail, session.email));
      const spend = rows.reduce((sum, row) => sum + Number(row.total), 0);
      const points = Math.floor(spend);
      const tier = points >= 2000 ? "Gold" : points >= 800 ? "Silver" : "Bronze";
      return res.json({
        totalSpend: spend,
        loyaltyPoints: points,
        tier,
        referralCode: session.email.split("@")[0].toUpperCase().slice(0, 6),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    try {
      const session = await getSession(req);
      const input = z.object({
        topic: z.string().min(3),
        message: z.string().min(5).max(1500),
      }).parse(req.body);
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          userEmail: session?.email || null,
          topic: input.topic,
          message: input.message,
          status: "open",
        })
        .returning();
      return res.status(201).json(ticket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/returns/request", async (req, res) => {
    try {
      const session = await requireAuth(req);
      const input = z.object({
        orderId: z.number().int().positive(),
        reason: z.string().min(5).max(500),
      }).parse(req.body);
      const [ownedOrder] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.customerEmail, session.email)))
        .limit(1);
      if (!ownedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      const [request] = await db
        .insert(returnRequests)
        .values({
          orderId: input.orderId,
          userEmail: session.email,
          reason: input.reason,
          status: "requested",
        })
        .returning();
      await db.insert(returnStatusEvents).values({
        returnRequestId: request.id,
        status: "requested",
        note: "Request submitted",
      });
      return res.status(201).json({ ok: true, request });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    try {
      await requireAdmin(req);
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const rows = search
        ? await db.select().from(products).where(ilike(products.name, `%${search}%`)).orderBy(desc(products.id))
        : await db.select().from(products).orderBy(desc(products.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      await requireAdmin(req);
      const input = z.object({
        name: z.string().min(2),
        description: z.string().min(3),
        price: z.number().positive(),
        imageUrl: z.string().url(),
        imageGallery: z.array(z.string().url()).default([]),
        categoryId: z.number().int().positive(),
        vendorId: z.number().int().positive().optional(),
        rating: z.number().min(0).max(5).default(4.5),
        isFeatured: z.boolean().default(false),
        stockQuantity: z.number().int().nonnegative().default(0),
      }).parse(req.body);

      const [row] = await db.insert(products).values({
        ...input,
        price: input.price.toFixed(2),
        rating: input.rating.toFixed(1),
      }).returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const input = z.object({
        name: z.string().min(2).optional(),
        description: z.string().min(3).optional(),
        price: z.number().positive().optional(),
        imageUrl: z.string().url().optional(),
        imageGallery: z.array(z.string().url()).optional(),
        categoryId: z.number().int().positive().optional(),
        vendorId: z.number().int().positive().optional(),
        rating: z.number().min(0).max(5).optional(),
        isFeatured: z.boolean().optional(),
        stockQuantity: z.number().int().nonnegative().optional(),
      }).parse(req.body);
      const payload: Record<string, unknown> = { ...input };
      if (input.price !== undefined) payload.price = input.price.toFixed(2);
      if (input.rating !== undefined) payload.rating = input.rating.toFixed(1);
      const [row] = await db.update(products).set(payload).where(eq(products.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Product not found" });
      return res.json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const [row] = await db.delete(products).where(eq(products.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Product not found" });
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/products/restock-low", async (req, res) => {
    try {
      await requireAdmin(req);
      const input = z.object({
        threshold: z.number().int().nonnegative().default(5),
        quantity: z.number().int().positive().default(20),
      }).parse(req.body);
      const updated = await db
        .update(products)
        .set({ stockQuantity: input.quantity })
        .where(lte(products.stockQuantity, input.threshold))
        .returning({ id: products.id });
      return res.json({ updated: updated.length });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/vendors", async (req, res) => {
    try {
      await requireAdmin(req);
      const rows = await db.select().from(vendors).orderBy(desc(vendors.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/vendors", async (req, res) => {
    try {
      await requireAdmin(req);
      const input = z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
        contactEmail: z.string().email(),
        active: z.boolean().default(true),
      }).parse(req.body);
      const [row] = await db.insert(vendors).values(input).returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/promotions", async (req, res) => {
    try {
      await requireAdmin(req);
      const rows = await db.select().from(promotions).orderBy(desc(promotions.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/promotions", async (req, res) => {
    try {
      await requireAdmin(req);
      const input = z.object({
        name: z.string().min(2),
        type: z.enum(["percent", "fixed", "bogo"]),
        value: z.number().nonnegative(),
        bogoBuyQty: z.number().int().positive().optional(),
        bogoGetQty: z.number().int().positive().optional(),
        startsAt: z.string(),
        endsAt: z.string(),
        audience: z.string().default("all"),
        active: z.boolean().default(true),
      }).parse(req.body);
      const [row] = await db.insert(promotions).values({
        ...input,
        value: input.value.toFixed(2),
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      }).returning();
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/inventory/forecast", async (req, res) => {
    try {
      await requireAdmin(req);
      const days = Math.max(7, Math.min(90, Number(req.query.days || 30)));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const sold = await db
        .select({
          productId: orderItems.productId,
          soldQty: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(gte(orders.createdAt, since))
        .groupBy(orderItems.productId);
      const productRows = await db.select().from(products);
      const map = new Map(sold.map((row) => [row.productId, Number(row.soldQty || 0)]));
      return res.json(productRows.map((product) => {
        const soldQty = map.get(product.id) || 0;
        const daily = soldQty / days;
        const daysUntilOut = daily > 0 ? Math.floor(product.stockQuantity / daily) : null;
        return {
          productId: product.id,
          productName: product.name,
          stockQuantity: product.stockQuantity,
          avgDailySales: Number(daily.toFixed(2)),
          forecastDaysUntilOut: daysUntilOut,
        };
      }));
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/returns", async (req, res) => {
    try {
      await requireAdmin(req);
      const rows = await db.select().from(returnRequests).orderBy(desc(returnRequests.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/returns/:id/status", async (req, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const input = z.object({
        status: z.enum(["requested", "approved", "rejected", "refunded"]),
        note: z.string().optional(),
      }).parse(req.body);
      const [updated] = await db.update(returnRequests).set({ status: input.status }).where(eq(returnRequests.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Return request not found" });
      await db.insert(returnStatusEvents).values({
        returnRequestId: id,
        status: input.status,
        note: input.note,
      });
      return res.json(updated);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      await requireAdmin(req);
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const status = typeof req.query.status === "string" ? req.query.status : "";
      const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : "";
      const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : "";

      const conditions = [];
      if (search) {
        conditions.push(sql`(${orders.orderNumber} ILIKE ${`%${search}%`} OR ${orders.customerEmail} ILIKE ${`%${search}%`})`);
      }
      if (status) conditions.push(eq(orders.status, status));
      if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo)));

      const rows = conditions.length > 0
        ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.id))
        : await db.select().from(orders).orderBy(desc(orders.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const input = z.object({
        status: z.enum(["pending", "packed", "shipped", "delivered", "cancelled", "paid", "payment_failed"]),
      }).parse(req.body);
      const [row] = await db.update(orders).set({ status: input.status }).where(eq(orders.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Order not found" });
      await sendSmsOrWhatsApp(
        process.env.TWILIO_TO || "",
        `UrugoBuy: Order ${row.orderNumber} status changed to ${row.status}.`,
      ).catch(() => undefined);
      return res.json(row);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/categories", async (req, res) => {
    try {
      await requireAdmin(req);
      const rows = await db.select().from(categories).orderBy(asc(categories.id));
      return res.json(rows);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      await requireAdmin(req);

      const [orderAgg] = await db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
          revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        })
        .from(orders);

      const [productAgg] = await db
        .select({
          totalProducts: sql<number>`COUNT(*)`,
          lowStock: sql<number>`COUNT(*) FILTER (WHERE ${products.stockQuantity} <= 5)`,
        })
        .from(products);

      const topProducts = await db
        .select({
          productId: orderItems.productId,
          productName: orderItems.productName,
          soldQty: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .groupBy(orderItems.productId, orderItems.productName)
        .orderBy(desc(sql`SUM(${orderItems.quantity})`))
        .limit(5);

      return res.json({
        totalOrders: Number(orderAgg?.totalOrders || 0),
        revenue: Number(orderAgg?.revenue || 0),
        totalProducts: Number(productAgg?.totalProducts || 0),
        lowStockProducts: Number(productAgg?.lowStock || 0),
        topProducts,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics/advanced", async (req, res) => {
    try {
      await requireAdmin(req);
      const [summary] = await db
        .select({
          ordersCount: sql<number>`COUNT(*)`,
          revenue: sql<string>`COALESCE(SUM(${orders.total}),0)`,
          avgOrderValue: sql<string>`COALESCE(AVG(${orders.total}),0)`,
        })
        .from(orders);

      const daily = await db
        .select({
          day: sql<string>`DATE(${orders.createdAt})::text`,
          revenue: sql<string>`COALESCE(SUM(${orders.total}),0)`,
          orders: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(desc(sql`DATE(${orders.createdAt})`))
        .limit(14);

      return res.json({
        ordersCount: Number(summary?.ordersCount || 0),
        revenue: Number(summary?.revenue || 0),
        avgOrderValue: Number(summary?.avgOrderValue || 0),
        daily: daily.reverse().map((row) => ({
          day: row.day,
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
        })),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
      if (err instanceof Error && err.message === "Forbidden") return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
