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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-border bg-card px-6 py-10 md:px-10 md:py-12">
          <p className="text-sm uppercase tracking-[0.24em] text-primary/70">About Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">About UrugoBuy</h1>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-muted-foreground">
            UrugoBuy is an e-commerce storefront built to help shoppers discover products more confidently through clear
            browsing, straightforward policies, useful support information, and practical shopping content. We want the
            store to feel complete, reliable, and easier to understand from the first click to the final checkout step.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Clearer shopping",
                body: "We focus on product discovery, readable details, and easier comparisons so visitors can make better decisions.",
              },
              {
                title: "Better trust",
                body: "We include contact details, legal pages, support pathways, and original content to help the business feel more complete.",
              },
              {
                title: "Real usefulness",
                body: "UrugoBuy aims to be more than a product grid by helping visitors understand products, delivery, and support before they buy.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-background p-5">
                <h2 className="font-display text-2xl font-semibold text-foreground">{item.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
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

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Why We Built It This Way</h2>
            <p>
              Many online stores move shoppers quickly toward checkout but leave too many questions unanswered. UrugoBuy
              is being shaped differently. We want visitors to understand what they are buying, what support is available,
              and what the business stands for before they decide to place an order.
            </p>
            <p className="mt-3">
              That means spending more time on navigation, product details, policy pages, and useful supporting content.
              A trustworthy storefront should not feel hidden, confusing, or incomplete. It should feel like a business
              that respects the shopper&apos;s time.
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
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">What Shoppers Can Expect</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Product pages that try to show more detail, stronger galleries, and fuller descriptions.",
                "Support routes that are easier to find, including Contact, FAQ, tracking, and legal pages.",
                "Shopping guides and original content that help visitors compare products before checkout.",
                "A storefront that keeps improving in clarity, responsiveness, and overall professionalism.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-background p-4">
                  <p>{item}</p>
                </div>
              ))}
            </div>
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

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Our Working Principles</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Clarity before pressure",
                  body: "We want product pages, categories, and business information to answer questions instead of rushing visitors through the site.",
                },
                {
                  title: "Trust through visibility",
                  body: "Important pages like About, Contact, Privacy, Terms, and support routes should be easy to find from anywhere on the site.",
                },
                {
                  title: "Useful content matters",
                  body: "Shopping guides, FAQs, and better descriptions can help visitors make decisions with less guesswork and more confidence.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background p-5">
                  <h3 className="font-display text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
