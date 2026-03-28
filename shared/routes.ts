import { z } from 'zod';
import { insertSubscriberSchema, categories, products, subscribers } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
  },
  products: {
    sortEnum: z.enum([
      'newest',
      'price-asc',
      'price-desc',
      'rating-desc',
      'name-asc',
    ]),
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        categoryId: z.coerce.number().optional(),
        featured: z.coerce.boolean().optional(),
        inStock: z.coerce.boolean().optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
        sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating-desc', 'name-asc']).optional(),
        search: z.string().optional(),
        lang: z.enum(['en', 'fr', 'ar', 'rw']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  newsletter: {
    subscribe: {
      method: 'POST' as const,
      path: '/api/newsletter/subscribe' as const,
      input: insertSubscriberSchema,
      responses: {
        201: z.custom<typeof subscribers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  checkout: {
    quote: {
      method: 'POST' as const,
      path: '/api/checkout/quote' as const,
      input: z.object({
        couponCode: z.string().optional(),
        giftCardCode: z.string().optional(),
        country: z.string().optional(),
        fulfillmentType: z.enum(["delivery", "pickup"]).optional(),
        shippingService: z.enum(["economy", "priority", "express", "pickup"]).optional(),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().min(1).max(20),
          }),
        ).min(1, "At least one product is required"),
      }),
      responses: {
        200: z.object({
          subtotal: z.number(),
          shippingFee: z.number(),
          tax: z.number(),
          discount: z.number().default(0),
          giftCardDiscount: z.number().default(0),
          couponCode: z.string().optional(),
          giftCardCode: z.string().optional(),
          taxRate: z.number().optional(),
          total: z.number(),
          market: z.object({
            country: z.string(),
            currencyCode: z.string(),
            currencySymbol: z.string(),
            exchangeRate: z.number(),
            shippingZone: z.string(),
            estimatedDaysMin: z.number(),
            estimatedDaysMax: z.number(),
            freeShippingThreshold: z.number(),
            customsNotice: z.string().nullable(),
            supportedPaymentMethods: z.array(z.enum(["card", "paypal", "momo", "cod"])),
            preferredPaymentMethod: z.enum(["card", "paypal", "momo", "cod"]),
            supportedFulfillmentTypes: z.array(z.enum(["delivery", "pickup"])),
            shippingServices: z.array(z.object({
              id: z.enum(["economy", "priority", "express", "pickup"]),
              fulfillmentType: z.enum(["delivery", "pickup"]),
              fee: z.number(),
              estimatedDaysMin: z.number(),
              estimatedDaysMax: z.number(),
            })),
            selectedShippingService: z.enum(["economy", "priority", "express", "pickup"]),
          }),
          converted: z.object({
            subtotal: z.number(),
            shippingFee: z.number(),
            tax: z.number(),
            discount: z.number(),
            giftCardDiscount: z.number(),
            total: z.number(),
          }),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  payments: {
    session: {
      method: 'GET' as const,
      path: '/api/payments/:orderId/session' as const,
      responses: {
        200: z.object({
          orderId: z.number(),
          orderNumber: z.string(),
          amount: z.number(),
          currencyCode: z.string(),
          method: z.enum(["card", "paypal", "momo"]),
          provider: z.enum(["demo", "paypal"]),
          status: z.enum(["created", "approved", "captured", "failed", "expired"]),
          approvalUrl: z.string().url().nullable(),
          expiresAt: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
    resume: {
      method: 'GET' as const,
      path: '/api/payments/:orderId/resume' as const,
      responses: {
        200: z.object({
          checkoutUrl: z.string().url(),
          sessionToken: z.string(),
          expiresAt: z.string(),
          provider: z.enum(["demo", "paypal"]),
          method: z.enum(["card", "paypal", "momo"]),
        }),
        404: errorSchemas.notFound,
      },
    },
    restart: {
      method: 'POST' as const,
      path: '/api/payments/:orderId/restart' as const,
      responses: {
        200: z.object({
          checkoutUrl: z.string().url(),
          sessionToken: z.string(),
          expiresAt: z.string(),
          provider: z.enum(["demo", "paypal"]),
          method: z.enum(["card", "paypal", "momo"]),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    confirm: {
      method: 'POST' as const,
      path: '/api/payments/:orderId/confirm' as const,
      input: z.object({
        sessionToken: z.string().min(8),
        action: z.enum(["confirm", "fail"]).default("confirm"),
        payerId: z.string().optional(),
        providerToken: z.string().optional(),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          paymentStatus: z.enum(["paid", "payment_failed"]),
          orderStatus: z.enum(["paid", "payment_failed"]),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: z.object({
        customerName: z.string().min(2, "Customer name is required"),
        customerEmail: z.string().email("Invalid email address"),
        customerPhone: z.string().min(7, "Phone number is required").max(30).optional(),
        shippingAddress: z.string().min(5, "Shipping address is required"),
        city: z.string().min(2, "City is required"),
        country: z.string().min(2).default("USA"),
        couponCode: z.string().optional(),
        giftCardCode: z.string().optional(),
        deliverySlot: z.string().optional(),
        fulfillmentType: z.enum(["delivery", "pickup"]).optional(),
        shippingService: z.enum(["economy", "priority", "express", "pickup"]).optional(),
        paymentMethod: z.enum(["card", "paypal", "momo", "cod"]).optional(),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().min(1).max(20),
          }),
        ).min(1, "At least one product is required"),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          orderNumber: z.string(),
          total: z.number(),
          status: z.string(),
          accessToken: z.string(),
          payment: z.object({
            required: z.boolean(),
            method: z.enum(["card", "paypal", "momo", "cod"]),
            provider: z.enum(["demo", "paypal"]).nullable(),
            checkoutUrl: z.string().url().nullable(),
            sessionToken: z.string().nullable(),
            expiresAt: z.string().nullable(),
          }).optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: z.object({
          order: z.object({
            id: z.number(),
            orderNumber: z.string(),
            customerName: z.string(),
            customerEmail: z.string(),
            customerPhone: z.string().optional().nullable(),
            shippingAddress: z.string(),
            city: z.string(),
            country: z.string(),
            subtotal: z.string(),
            shippingFee: z.string(),
            tax: z.string(),
            total: z.string(),
            status: z.string(),
            couponCode: z.string().optional(),
            giftCardCode: z.string().optional(),
            giftCardDiscount: z.string().optional(),
            deliverySlot: z.string().optional(),
            paymentMethod: z.string().optional(),
            paymentStatus: z.string().optional(),
            shippingService: z.string().optional(),
            shipmentCarrier: z.string().optional().nullable(),
            trackingNumber: z.string().optional().nullable(),
            trackingUrl: z.string().optional().nullable(),
            shippingNote: z.string().optional().nullable(),
            shippedAt: z.string().or(z.date()).optional().nullable(),
            deliveredAt: z.string().or(z.date()).optional().nullable(),
            marketCountry: z.string().optional(),
            currencyCode: z.string().optional(),
            currencySymbol: z.string().optional(),
            exchangeRate: z.string().optional().or(z.number().optional()),
            createdAt: z.string().or(z.date()),
          }),
          items: z.array(
            z.object({
              id: z.number(),
              orderId: z.number(),
              productId: z.number(),
              productName: z.string(),
              unitPrice: z.string(),
              quantity: z.number(),
              lineTotal: z.string(),
            }),
          ),
        }),
        404: errorSchemas.notFound,
      },
    },
    lookup: {
      method: 'POST' as const,
      path: '/api/orders/lookup' as const,
      input: z.object({
        orderNumber: z.string().min(3),
        email: z.string().email(),
      }),
      responses: {
        200: z.object({
          orderId: z.number(),
          orderNumber: z.string(),
          accessToken: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// URL BUILDER HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
  let url = path;
  if (params) {
    // First replace path parameters (e.g. :id)
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
        // Remove the parameter so it doesn't get added to the query string
        delete params[key];
      }
    });
    
    // Add remaining parameters as query string
    const remainingParams = Object.entries(params).filter(([_, value]) => value !== undefined);
    if (remainingParams.length > 0) {
      const searchParams = new URLSearchParams();
      remainingParams.forEach(([key, value]) => searchParams.append(key, String(value)));
      url = `${url}?${searchParams.toString()}`;
    }
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type SubscribeInput = z.infer<typeof api.newsletter.subscribe.input>;
export type CheckoutQuoteInput = z.infer<typeof api.checkout.quote.input>;
export type CreateOrderInput = z.infer<typeof api.orders.create.input>;
export type ProductsListResponse = z.infer<typeof api.products.list.responses[200]>;
export type CategoriesListResponse = z.infer<typeof api.categories.list.responses[200]>;
