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
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        categoryId: z.coerce.number().optional(),
        featured: z.coerce.boolean().optional(),
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
export type ProductsListResponse = z.infer<typeof api.products.list.responses[200]>;
export type CategoriesListResponse = z.infer<typeof api.categories.list.responses[200]>;
