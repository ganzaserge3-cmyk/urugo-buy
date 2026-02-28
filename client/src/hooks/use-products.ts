import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface UseProductsParams {
  categoryId?: number;
  featured?: boolean;
  search?: string;
}

export function useProducts(params?: UseProductsParams) {
  return useQuery({
    queryKey: [api.products.list.path, params],
    queryFn: async () => {
      const url = buildUrl(api.products.list.path, params as Record<string, string | number | boolean>);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return api.products.list.responses[200].parse(data);
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      return api.products.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}
