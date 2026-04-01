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
  useSeo(t("contact.metaTitle"), t("contact.metaDescription"), {
    canonicalPath: "/contact-us",
    keywords: ["contact UrugoBuy", "customer support", "business inquiry", "wholesale contact"],
    type: "website",
  });

  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
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
        body: JSON.stringify({
          contactEmail: form.contactEmail,
          topic: `Website contact form - ${form.name.trim() || "Visitor"}`,
          message: `Name: ${form.name.trim() || "Not provided"}\n\n${form.message}`,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Could not send message" }));
        throw new Error(payload.message);
      }
      setForm((prev) => ({ ...prev, name: "", message: "" }));
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
          <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-3">Contact Us</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Welcome to UrugoBuy - we are here to help you.</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            If you have any questions, feedback, or need support, feel free to reach out to us. Our team will respond as soon as possible.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">Get in Touch</h2>
            <p className="text-sm text-muted-foreground mb-4">We are always ready to assist you with:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Product inquiries</li>
              <li>Order questions</li>
              <li>Website support</li>
              <li>General information</li>
            </ul>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Before you contact us",
                body: "It can help to include the product name, order number, or the main question you need answered so we can respond faster.",
              },
              {
                title: "What support covers",
                body: "We can help with product clarification, order questions, account or checkout support, and general site feedback.",
              },
              {
                title: "What to expect",
                body: "Support replies aim to be clear and practical. If we need more information, we will let you know what details are missing.",
              },
              {
                title: "Business communication",
                body: "For general business inquiries, partnership questions, or operational requests, you can use the same public contact details below.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Contact Information</p>
              <p className="mt-2 font-medium text-foreground">Email: urugobuy@gmail.com</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this email for product inquiries, support, and general business communication.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Location</p>
              <p className="mt-2 font-medium text-foreground">Kigali, Rwanda</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Update this if you want to show a more specific service area or office address later.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="font-medium text-foreground">Response Time</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We usually respond within <span className="font-medium text-foreground">24-48 hours</span>.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="font-medium text-foreground">Our Commitment</p>
            <p className="mt-2 text-sm text-muted-foreground">
              At UrugoBuy, we value every customer. Your questions, feedback, and suggestions help us improve and serve you better.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">Helpful Contact Notes</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                If your message is about a product, telling us what you want to confirm can speed things up. For example,
                you can ask about product availability, expected delivery timing, or what is included in a listing.
              </p>
              <p>
                If your message is about an order, include the email used at checkout and any order number you have. That
                helps us review the request more accurately and point you to the right next step.
              </p>
              <p>
                If your message is general feedback, suggestions are welcome too. UrugoBuy is being improved over time,
                and customer feedback helps us understand where the experience can become clearer and more useful.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-foreground">UrugoBuy - We're here for you.</p>

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

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 space-y-4 self-start">
          <h2 className="font-display text-2xl font-semibold">Send Us a Message</h2>
          <p className="text-sm text-muted-foreground">
            Please fill out the form below and we will get back to you shortly.
          </p>
          <Input
            placeholder="Enter your name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Enter your email"
            value={form.contactEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            required
          />
          <textarea
            className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Write your message..."
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            required
          />
          <Button type="submit" className="rounded-full w-full" disabled={isSubmitting}>
            {isSubmitting ? t("contact.sending") : "Send Message"}
          </Button>
          <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Why this form exists</p>
            <p className="mt-2">
              A complete business website should give visitors a direct way to ask questions, report issues, and request support.
              This form helps keep that support path visible and easy to use.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
