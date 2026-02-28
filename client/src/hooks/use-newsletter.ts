import { useMutation } from "@tanstack/react-query";
import { api, type SubscribeInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubscribeNewsletter() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SubscribeInput) => {
      const validated = api.newsletter.subscribe.input.parse(data);
      const res = await fetch(api.newsletter.subscribe.path, {
        method: api.newsletter.subscribe.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.newsletter.subscribe.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to subscribe");
      }

      return api.newsletter.subscribe.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
      });
    },
  });
}
