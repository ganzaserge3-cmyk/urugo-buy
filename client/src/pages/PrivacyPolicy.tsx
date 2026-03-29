import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPolicy() {
  const { t } = useI18n();
  useSeo(t("content.privacy.title"), t("content.privacy.body"), {
    canonicalPath: "/privacy-policy",
    keywords: ["privacy policy", "cookies policy", "advertising disclosure", "data usage", "UrugoBuy privacy"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{t("content.privacy.title")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t("content.privacy.body")}</p>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Information We Collect</h2>
            <p>
              We may collect personal information that visitors provide directly, including contact form submissions,
              newsletter signups, account information, and order-related details. We may also collect technical
              information such as browser type, pages visited, device information, and approximate location data for
              analytics, fraud prevention, and website quality monitoring.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Cookies and Similar Technologies</h2>
            <p>
              This website may use cookies, local storage, and similar technologies to remember user preferences,
              improve navigation, support carts and account sessions, measure performance, and understand how visitors
              interact with our content and product pages.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Advertising and Google AdSense</h2>
            <p>
              We may use third-party advertising services, including Google AdSense, to display ads on this website.
              These services may use cookies and similar technologies to serve relevant advertising based on your visit
              to this website and other websites.
            </p>
            <p className="mt-3">
              Google and its advertising partners may use cookies to personalize ads and measure ad performance. If
              advertising is enabled on the site, visitors may be shown ads based on prior browsing behavior, content
              interests, and website interaction patterns.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">How We Use Information</h2>
            <p>
              We use collected information to operate the website, process support requests, improve product and
              editorial content, monitor site performance, prevent abuse, and support business functions such as
              analytics, operational reporting, and advertising readiness.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Contact and Updates</h2>
            <p>
              If you have questions about this Privacy Policy, cookies, advertising, or your information, please use
              the official contact page. We may update this policy from time to time to reflect changes in technology,
              regulations, advertising integrations, or website operations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
