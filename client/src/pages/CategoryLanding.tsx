import { Link, useParams } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

const categoryHighlights: Record<string, { eyebrowKey: string; bodyKey: string; ctaKey: string }> = {
  fruits: {
    eyebrowKey: "categoryLanding.fruitsEyebrow",
    bodyKey: "categoryLanding.fruitsBody",
    ctaKey: "categoryLanding.fruitsCta",
  },
  foods: {
    eyebrowKey: "categoryLanding.foodsEyebrow",
    bodyKey: "categoryLanding.foodsBody",
    ctaKey: "categoryLanding.foodsCta",
  },
};

export default function CategoryLanding() {
  const { t } = useI18n();
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: categories = [] } = useCategories();
  const category = categories.find((item) => item.slug === slug);
  const { data: products = [] } = useProducts({ categoryId: category?.id });
  const highlight = categoryHighlights[slug] || {
    eyebrowKey: "categoryLanding.defaultEyebrow",
    bodyKey: "categoryLanding.defaultBody",
    ctaKey: "categoryLanding.defaultCta",
  };

  useSeo(
    category ? `${category.name} - UrugoBuy` : "Category - UrugoBuy",
    category ? `Explore ${category.name} products with delivery-ready pricing and trusted checkout.` : "Browse products by category.",
    { canonicalPath: category ? `/category/${category.slug}` : "/shop" },
  );

  if (!category) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-10 text-center">
          <h1 className="font-display text-4xl font-bold mb-3">{t("categoryLanding.notFoundTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("categoryLanding.notFoundBody")}</p>
          <Button asChild className="rounded-full">
            <Link href="/shop">{t("categoryLanding.backToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <section className="rounded-[2rem] border border-border bg-card overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] items-stretch">
            <div className="p-8 md:p-12">
              <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-4">{t(highlight.eyebrowKey)}</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{t(highlight.bodyKey)}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href={`/shop?categoryId=${category.id}`}>{t(highlight.ctaKey)}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/compare">{t("categoryLanding.compareCta")}</Link>
                </Button>
              </div>
            </div>
            <div className="min-h-[280px] bg-gradient-to-br from-primary/15 via-accent/10 to-background flex items-center justify-center p-8">
              {category.imageUrl ? (
                <img src={category.imageUrl} alt={category.name} className="max-h-80 w-full object-cover rounded-3xl border border-border shadow-sm" />
              ) : (
                <div className="rounded-3xl border border-dashed border-border w-full h-full min-h-[240px] flex items-center justify-center text-muted-foreground">
                  {category.name}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("categoryLanding.topPicks", { name: category.name })}</h2>
              <p className="text-muted-foreground mt-2">{t("categoryLanding.topPicksBody")}</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/track-order">{t("categoryLanding.trackOrder")}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-border bg-muted/30 p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-3">{t("categoryLanding.conversionEyebrow")}</p>
            <h2 className="font-display text-3xl font-bold mb-3">{t("categoryLanding.conversionTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl">{t("categoryLanding.conversionBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/checkout">{t("categoryLanding.checkoutCta")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/contact-us">{t("categoryLanding.supportCta")}</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-2xl font-semibold mb-2">{t("categoryLanding.deliveryTitle")}</h3>
              <p className="text-muted-foreground">{t("categoryLanding.deliveryBody")}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-2xl font-semibold mb-2">{t("categoryLanding.compareTitle")}</h3>
              <p className="text-muted-foreground">{t("categoryLanding.compareBody")}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
