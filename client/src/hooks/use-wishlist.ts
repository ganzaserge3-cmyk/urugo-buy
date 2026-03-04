import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export function useWishlist() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await authFetch("/api/wishlist");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, inWishlist }: { productId: number; inWishlist: boolean }) => {
      const res = await authFetch(`/api/wishlist/${productId}`, {
        method: inWishlist ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Wishlist update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useCreateWishlistShare() {
  return useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/wishlist/share", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create wishlist share");
      return res.json() as Promise<{ token: string; expiresAt: string }>;
    },
  });
}

export function useSharedWishlist(token: string) {
  return useQuery({
    queryKey: ["wishlist-share", token],
    queryFn: async () => {
      const res = await fetch(`/api/wishlist/share/${token}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load shared wishlist");
      return res.json();
    },
    enabled: token.trim().length > 0,
  });
}
