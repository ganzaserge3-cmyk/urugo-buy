import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth";

export function useReviews(productId: number) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${productId}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
    enabled: Number.isFinite(productId) && productId > 0,
  });
}

export function useCreateReview(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { rating: number; comment: string; photoUrl?: string; videoUrl?: string }) => {
      const res = await authFetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Failed to submit review" }));
        throw new Error(body.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });
}
