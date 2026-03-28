import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ContactUs() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  useSeo(t("contact.metaTitle"), t("contact.metaDescription"), { canonicalPath: "/contact-us" });

  const [form, setForm] = useState({
    contactEmail: "",
    topic: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => ({ ...prev, contactEmail: prev.contactEmail || user.email }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Could not send message" }));
        throw new Error(payload.message);
      }
      setForm((prev) => ({ ...prev, topic: "", message: "" }));
      toast({ title: t("contact.success"), description: t("contact.successBody") });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Message failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <section className="rounded-3xl border border-border bg-card p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-3">{t("contact.eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">{t("contact.body")}</p>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Link href="/faq" className="rounded-2xl border border-border bg-muted/30 p-4 hover:border-primary transition-colors">
              <p className="font-medium">{t("contact.quickFaq")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("footer.faq")}</p>
            </Link>
            <Link href="/shipping-delivery" className="rounded-2xl border border-border bg-muted/30 p-4 hover:border-primary transition-colors">
              <p className="font-medium">{t("contact.quickShipping")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("footer.shipping")}</p>
            </Link>
            <Link href="/international-shopping" className="rounded-2xl border border-border bg-muted/30 p-4 hover:border-primary transition-colors">
              <p className="font-medium">{t("contact.quickInternational")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("footer.international")}</p>
            </Link>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 space-y-4">
          <h2 className="font-display text-2xl font-semibold">{t("footer.contact")}</h2>
          <Input
            type="email"
            placeholder={t("contact.email")}
            value={form.contactEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            required
          />
          <Input
            placeholder={t("contact.topic")}
            value={form.topic}
            onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            required
          />
          <textarea
            className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("contact.message")}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            required
          />
          <Button type="submit" className="rounded-full w-full" disabled={isSubmitting}>
            {isSubmitting ? t("contact.sending") : t("contact.send")}
          </Button>
        </form>
      </div>
    </div>
  );
}
