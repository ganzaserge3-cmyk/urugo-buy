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
        }),
        400: errorSchemas.validation,
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
        shippingAddress: z.string().min(5, "Shipping address is required"),
        city: z.string().min(2, "City is required"),
        country: z.string().min(2).default("USA"),
        couponCode: z.string().optional(),
        giftCardCode: z.string().optional(),
        deliverySlot: z.string().optional(),
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
