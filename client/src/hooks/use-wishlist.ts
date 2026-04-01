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

export function useWishlistFolders() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["wishlist-folders"],
    queryFn: async () => {
      const res = await authFetch("/api/wishlist/folders");
      if (!res.ok) return [];
      return res.json() as Promise<Array<{
        folderName: string;
        count: number;
        items: Array<{ id: number; name: string; price: string; imageUrl: string; stockQuantity: number; folderName: string }>;
      }>>;
    },
    enabled: !!token,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, inWishlist, folderName }: { productId: number; inWishlist: boolean; folderName?: string }) => {
      const res = await authFetch(`/api/wishlist/${productId}`, {
        method: inWishlist ? "DELETE" : "POST",
        headers: !inWishlist ? { "Content-Type": "application/json" } : undefined,
        body: inWishlist ? undefined : JSON.stringify(folderName ? { folderName } : {}),
      });
      if (!res.ok) throw new Error("Wishlist update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-folders"] });
    },
  });
}

export function useMoveWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, folderName }: { productId: number; folderName: string }) => {
      const res = await authFetch(`/api/wishlist/${productId}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Failed to move wishlist item" }));
        throw new Error(payload.message || "Failed to move wishlist item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-folders"] });
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

export function useImportSharedWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await authFetch(`/api/wishlist/share/${token}/import`, { method: "POST" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Failed to import wishlist" }));
        throw new Error(payload.message || "Failed to import wishlist");
      }
      return res.json() as Promise<{ ok: boolean; imported: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-folders"] });
    },
  });
}
