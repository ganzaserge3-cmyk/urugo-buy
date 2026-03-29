import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function Careers() {
  const { t } = useI18n();
  useSeo(t("content.careers.title"), t("content.careers.body"), {
    canonicalPath: "/careers",
    keywords: ["careers", "work with UrugoBuy", "ecommerce jobs", "customer support careers"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{t("content.careers.title")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t("content.careers.body")}</p>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Why Join UrugoBuy</h2>
            <p>
              We are building an ecommerce platform that combines practical grocery shopping, clearer product
              information, and a stronger digital customer experience. As the platform grows, we value people who care
              about trust, usability, operational quality, and long-term business credibility.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Operations",
                body: "Support catalog quality, logistics coordination, content organization, and everyday business execution.",
              },
              {
                title: "Customer Support",
                body: "Help visitors with questions, order guidance, product clarity, and issue resolution across the site.",
              },
              {
                title: "Growth",
                body: "Contribute to merchandising, content, discoverability, trust-building, and overall platform improvement.",
              },
            ].map((item) => (
              <section key={item.title} className="rounded-3xl border border-border bg-muted/20 p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">{item.title}</h2>
                <p>{item.body}</p>
              </section>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">How to Reach Us</h2>
            <p>
              If you are interested in future collaboration or career opportunities, contact the team through the
              official contact page and include your background, area of interest, and how you believe you can support
              the growth of the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
