import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function TermsOfService() {
  const { t } = useI18n();
  useSeo(t("content.terms.title"), t("content.terms.body"), {
    canonicalPath: "/terms-of-service",
    keywords: ["terms of service", "website terms", "store terms", "UrugoBuy terms"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{t("content.terms.title")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t("content.terms.body")}</p>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Website Use</h2>
            <p>
              By accessing this website, you agree to use it lawfully and in a way that does not damage the platform,
              its visitors, its content, or its services. Unauthorized access attempts, abusive activity, and use that
              interferes with normal operation are not permitted.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Content and Product Information</h2>
            <p>
              We work to keep product information, editorial content, pricing, and support information accurate and
              useful. However, listings, availability, descriptions, media, and other website content may change,
              improve, or be removed at any time as the site evolves.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Orders and Support</h2>
            <p>
              Support requests, account activity, and order-related interactions may be reviewed for verification,
              security, and service quality. We reserve the right to limit, cancel, or adjust requests when necessary
              for fraud prevention, compliance, stock accuracy, or operational reasons.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Third-Party Services</h2>
            <p>
              The website may contain external services, analytics tools, payment flows, advertising integrations, or
              links to third-party websites. We are not responsible for the content or privacy practices of third-party
              services once you leave this website.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Changes to These Terms</h2>
            <p>
              We may revise these Terms of Service as the business, content, legal requirements, or site functionality
              changes. Continued use of the website after updates means you accept the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
