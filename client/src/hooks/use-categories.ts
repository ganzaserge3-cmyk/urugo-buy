import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getFallbackCategories } from "@/lib/fallback-catalog";

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.categories.list.path);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        return api.categories.list.responses[200].parse(data);
      } catch {
        return getFallbackCategories();
      }
    },
  });
}
