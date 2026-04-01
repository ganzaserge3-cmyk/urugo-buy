import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function AboutUs() {
  useI18n();
  useSeo("About UrugoBuy", "Learn what UrugoBuy is, who it serves, and the mission behind the storefront and shopping guides.", {
    canonicalPath: "/about-us",
    keywords: ["about UrugoBuy", "fresh grocery business", "fruit and food store", "online grocery brand"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">About UrugoBuy</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
          UrugoBuy is an e-commerce storefront built to help shoppers discover products more confidently through clear
          browsing, straightforward policies, and helpful shopping content.
        </p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">What UrugoBuy Is</h2>
            <p>
              UrugoBuy is a modern shopping platform focused on everyday products, home needs, and helpful buying
              guidance. The goal is not only to display products, but to make the overall website easier to trust,
              easier to navigate, and more useful to real visitors.
            </p>
            <p className="mt-3">
              We work to present products with clearer structure, accessible support information, readable policies, and
              original editorial content that helps people make better shopping decisions online.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Mission",
                body: "Our mission is to make online shopping feel more transparent, practical, and dependable for everyday buyers.",
              },
              {
                title: "Who We Serve",
                body: "UrugoBuy is designed for households, individual shoppers, and visitors who want a cleaner way to browse products and understand what they are buying.",
              },
              {
                title: "How We Help",
                body: "We combine product browsing with useful trust pages, shopping guides, and direct contact options so visitors can make informed decisions.",
              },
            ].map((item) => (
              <section key={item.title} className="rounded-3xl border border-border bg-muted/20 p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">{item.title}</h2>
                <p>{item.body}</p>
              </section>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">How We Present the Business</h2>
            <p>
              We believe a trustworthy online store should make it easy for visitors to understand who is behind the
              website, how support works, and where to find important policies before placing an order.
            </p>
            <p className="mt-3">
              That is why UrugoBuy includes contact information, legal pages, support routes, and practical editorial
              content alongside product browsing. The goal is to help people shop with more clarity, not just more speed.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
