import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { setOrderAccessToken } from "@/lib/order-access";

export default function TrackOrder() {
  useSeo("Track Order - UrugoBuy", "Look up an order using your order number and email address.", { canonicalPath: "/track-order" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Order not found" }));
        throw new Error(payload.message);
      }
      const payload = await res.json() as { orderId: number; accessToken: string };
      setOrderAccessToken(payload.orderId, payload.accessToken);
      navigate(`/order-success/${payload.orderId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Order lookup failed",
        description: error instanceof Error ? error.message : "Please check your order number and email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 bg-background">
      <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 space-y-5">
        <div>
          <h1 className="font-display text-4xl font-bold">Track Your Order</h1>
          <p className="text-muted-foreground mt-2">Enter the order number and email used at checkout to open your order page.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Order number"
            value={form.orderNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Button type="submit" className="rounded-full w-full" disabled={isSubmitting}>
            {isSubmitting ? "Looking up order..." : "Open order"}
          </Button>
        </form>
      </div>
    </div>
  );
}
