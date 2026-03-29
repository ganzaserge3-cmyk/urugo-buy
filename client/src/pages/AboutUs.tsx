import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function AboutUs() {
  const { t } = useI18n();
  useSeo(t("content.about.title"), t("content.about.body"), {
    canonicalPath: "/about-us",
    keywords: ["about UrugoBuy", "fresh grocery business", "fruit and food store", "online grocery brand"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{t("content.about.title")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t("content.about.body")}</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Who We Are</h2>
            <p>
              UrugoBuy is a modern ecommerce storefront focused on fresh fruits, food staples, grocery content, and a
              shopping experience that feels more transparent and reliable than a generic product catalog.
            </p>
            <p className="mt-3">
              We aim to make it easier for visitors to understand what they are buying by providing clearer product
              descriptions, stronger legal pages, visible support channels, and a website structure that reflects a real
              business platform.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Trust",
                body: "We believe online shoppers need visible policies, real contact options, and clear product information before making a purchase decision.",
              },
              {
                title: "Content",
                body: "We publish practical information about grocery shopping, product quality, and online buying confidence to help visitors make better choices.",
              },
              {
                title: "Support",
                body: "Our site includes official business pages and a contact channel for customer support, partnerships, advertising, and general inquiries.",
              },
            ].map((item) => (
              <section key={item.title} className="rounded-3xl border border-border bg-muted/20 p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">{item.title}</h2>
                <p>{item.body}</p>
              </section>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Our Direction</h2>
            <p>
              UrugoBuy continues to grow as both an ecommerce destination and a helpful publishing platform. We work to
              improve product presentation, site quality, discoverability, and visitor trust across every major page of
              the website.
            </p>
            <p className="mt-3">
              If you would like to contact us for support, a business question, a partnership discussion, or site
              feedback, please use the official contact page so our team can respond directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
