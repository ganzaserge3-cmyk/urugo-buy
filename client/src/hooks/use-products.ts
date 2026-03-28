import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getStoredLanguageCode } from "@/lib/i18n";
import {
  getFallbackProduct,
  getFallbackProducts,
  getFallbackSearchSuggestions,
} from "@/lib/fallback-catalog";

interface UseProductsParams {
  categoryId?: number;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";
  search?: string;
}

export function useProducts(params?: UseProductsParams) {
  const lang = getStoredLanguageCode();
  return useQuery({
    queryKey: [api.products.list.path, params, lang],
    queryFn: async () => {
      try {
        const hasSearch = Boolean(params?.search && params.search.trim().length > 0);
        const url = hasSearch
          ? buildUrl("/api/search/advanced", {
            q: params?.search || "",
            categoryId: params?.categoryId as number,
            featured: params?.featured as boolean,
            inStock: params?.inStock as boolean,
            minPrice: params?.minPrice as number,
            maxPrice: params?.maxPrice as number,
            sort: params?.sort as string,
            lang,
          } as Record<string, string | number | boolean>)
          : buildUrl(api.products.list.path, { ...(params || {}), lang } as Record<string, string | number | boolean>);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        return api.products.list.responses[200].parse(data);
      } catch {
        return getFallbackProducts(params);
      }
    },
  });
}

export function useProduct(id: number) {
  const lang = getStoredLanguageCode();
  return useQuery({
    queryKey: [api.products.get.path, id, lang],
    queryFn: async () => {
      try {
        const url = buildUrl(api.products.get.path, { id, lang: getStoredLanguageCode() });
        const res = await fetch(url);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        return api.products.get.responses[200].parse(data);
      } catch {
        return getFallbackProduct(id);
      }
    },
    enabled: !!id,
  });
}

export function useRecommendations(productId: number) {
  return useQuery({
    queryKey: ["recommendations", productId],
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/${productId}`);
      if (!res.ok) throw new Error("Failed to load recommendations");
      return res.json();
    },
    enabled: Number.isFinite(productId) && productId > 0,
  });
}

export function useCompareProducts(ids: number[]) {
  return useQuery({
    queryKey: ["compare", ids],
    queryFn: async () => {
      const res = await fetch(`/api/compare?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error("Failed to compare products");
      return res.json();
    },
    enabled: ids.length >= 2,
  });
}

export function useBundleSuggestions(productId: number) {
  return useQuery({
    queryKey: ["bundles", productId],
    queryFn: async () => {
      const res = await fetch(`/api/bundles/${productId}`);
      if (!res.ok) throw new Error("Failed to load bundle suggestions");
      return res.json() as Promise<Array<{
        id: number;
        name: string;
        price: string;
        imageUrl: string;
        pairCount: number;
      }>>;
    },
    enabled: Number.isFinite(productId) && productId > 0,
  });
}

export function useSearchSuggestions(query: string) {
  const lang = getStoredLanguageCode();
  return useQuery({
    queryKey: ["search-suggest", query, lang],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(lang)}`);
        if (!res.ok) throw new Error("Failed to load suggestions");
        return res.json() as Promise<Array<{ id: number; name: string; price: string; categoryId?: number | null }>>;
      } catch {
        return getFallbackSearchSuggestions(query);
      }
    },
    enabled: query.trim().length >= 2,
  });
}
