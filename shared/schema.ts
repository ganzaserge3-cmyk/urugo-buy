import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery").array().notNull().default([]),
  categoryId: integer("category_id").references(() => categories.id),
  vendorId: integer("vendor_id"),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0.0"),
  isFeatured: boolean("is_featured").default(false),
  stockQuantity: integer("stock_quantity").notNull().default(0),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  bogoBuyQty: integer("bogo_buy_qty"),
  bogoGetQty: integer("bogo_get_qty"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  audience: text("audience").notNull().default("all"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productQuestions = pgTable("product_questions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userEmail: text("user_email"),
  question: text("question").notNull(),
  answer: text("answer"),
  answeredBy: text("answered_by"),
  answeredAt: timestamp("answered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("USA"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
});

export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userEmail: text("user_email").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
  comment: text("comment").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accountPreferences = pgTable("account_preferences", {
  userEmail: text("user_email").primaryKey(),
  priceDropAlerts: boolean("price_drop_alerts").notNull().default(true),
  stockAlerts: boolean("stock_alerts").notNull().default(true),
  essentialsSubscription: boolean("essentials_subscription").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wishlistShares = pgTable("wishlist_shares", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email"),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userEmail: text("user_email").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("requested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const returnStatusEvents = pgTable("return_status_events", {
  id: serial("id").primaryKey(),
  returnRequestId: integer("return_request_id").notNull().references(() => returnRequests.id),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const twoFactorChallenges = pgTable("two_factor_challenges", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  purpose: text("purpose").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  productId: integer("product_id").references(() => products.id),
  frequency: text("frequency").notNull().default("weekly"),
  status: text("status").notNull().default("active"),
  nextRunAt: timestamp("next_run_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationSubscriptions = pgTable("notification_subscriptions", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email"),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh"),
  auth: text("auth"),
  platform: text("platform").notNull().default("web"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentPages = pgTable("content_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  body: text("body").notNull(),
  seoJsonLd: text("seo_json_ld"),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  published: boolean("published").notNull().default(true),
});

export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  ipAddress: text("ip_address"),
  score: integer("score").notNull(),
  reasons: text("reasons").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const currencyRates = pgTable("currency_rates", {
  code: text("code").primaryKey(),
  rateFromUsd: numeric("rate_from_usd", { precision: 12, scale: 6 }).notNull(),
  symbol: text("symbol").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  discountType: text("discount_type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minSpend: numeric("min_spend", { precision: 10, scale: 2 }).notNull().default("0.00"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderMeta = pgTable("order_meta", {
  orderId: integer("order_id").primaryKey().references(() => orders.id),
  couponCode: text("coupon_code"),
  deliverySlot: text("delivery_slot"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status"),
});

export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  channel: text("channel").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// === RELATIONS ===

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductReviewSchema = createInsertSchema(productReviews).omit({ id: true, createdAt: true });
export const insertWishlistSchema = createInsertSchema(wishlists).omit({ id: true, createdAt: true });
export const insertAccountPreferencesSchema = createInsertSchema(accountPreferences).omit({ updatedAt: true });
export const insertWishlistShareSchema = createInsertSchema(wishlistShares).omit({ id: true, createdAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true });
export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({ id: true, createdAt: true });
export const insertTwoFactorChallengeSchema = createInsertSchema(twoFactorChallenges).omit({ id: true, createdAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true });
export const insertProductQuestionSchema = createInsertSchema(productQuestions).omit({ id: true, createdAt: true });
export const insertReturnStatusEventSchema = createInsertSchema(returnStatusEvents).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertNotificationSubscriptionSchema = createInsertSchema(notificationSubscriptions).omit({ id: true, createdAt: true });
export const insertContentPageSchema = createInsertSchema(contentPages).omit({ id: true, updatedAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true });
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({ id: true, createdAt: true });
export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({ updatedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ createdAt: true });
export const insertOrderMetaSchema = createInsertSchema(orderMeta);
export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type AccountPreferences = typeof accountPreferences.$inferSelect;
export type InsertAccountPreferences = z.infer<typeof insertAccountPreferencesSchema>;
export type WishlistShare = typeof wishlistShares.$inferSelect;
export type InsertWishlistShare = z.infer<typeof insertWishlistShareSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;
export type TwoFactorChallenge = typeof twoFactorChallenges.$inferSelect;
export type InsertTwoFactorChallenge = z.infer<typeof insertTwoFactorChallengeSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type ProductQuestion = typeof productQuestions.$inferSelect;
export type InsertProductQuestion = z.infer<typeof insertProductQuestionSchema>;
export type ReturnStatusEvent = typeof returnStatusEvents.$inferSelect;
export type InsertReturnStatusEvent = z.infer<typeof insertReturnStatusEventSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;
export type InsertNotificationSubscription = z.infer<typeof insertNotificationSubscriptionSchema>;
export type ContentPage = typeof contentPages.$inferSelect;
export type InsertContentPage = z.infer<typeof insertContentPageSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type OrderMeta = typeof orderMeta.$inferSelect;
export type InsertOrderMeta = z.infer<typeof insertOrderMetaSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

// Request types
export type SubscribeRequest = InsertSubscriber;

// Response types
export type CategoryResponse = Category;
export type CategoriesListResponse = Category[];

export type ProductResponse = Product;
export type ProductsListResponse = Product[];

export type SubscriberResponse = Subscriber;

export type OrderResponse = Order;
export type OrderItemResponse = OrderItem;
