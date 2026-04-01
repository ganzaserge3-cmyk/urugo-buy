import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Mail, ShieldCheck, Truck, FileText, BadgeHelp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useSubscribeNewsletter } from "@/hooks/use-newsletter";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

const shoppingGuides = [
  {
    slug: "how-to-choose-quality-products-online-in-rwanda",
    title: "How to choose quality products online in Rwanda",
    excerpt: "Learn what to check before you buy, from product detail clarity to trust pages and delivery information.",
  },
  {
    slug: "tips-for-safe-online-shopping",
    title: "Tips for safe online shopping",
    excerpt: "Simple habits that help you shop more safely, compare stores carefully, and avoid rushed buying decisions.",
  },
  {
    slug: "best-home-and-lifestyle-buying-tips",
    title: "Best home and lifestyle buying tips",
    excerpt: "Practical ways to compare household products, plan purchases, and choose items that truly fit your routine.",
  },
  {
    slug: "how-to-compare-prices-without-sacrificing-quality",
    title: "How to compare prices without sacrificing quality",
    excerpt: "Compare value, not just the lowest number, by checking product details, support, and long-term usefulness.",
  },
  {
    slug: "questions-to-ask-before-buying-household-items-online",
    title: "Questions to ask before buying household items online",
    excerpt: "A quick checklist for judging fit, material, durability, and support before you place an order.",
  },
] as const;

const homeFaqs = [
  {
    question: "How does ordering work on UrugoBuy?",
    answer: "Browse products, review item details, add to cart, complete checkout, and follow updates from your order page.",
  },
  {
    question: "Where can I find business and policy information?",
    answer: "You can use the About Us, Contact Us, Privacy Policy, and Terms & Conditions pages linked in the navigation and footer.",
  },
  {
    question: "Does UrugoBuy publish helpful shopping content?",
    answer: "Yes. We include shopping guides and practical articles to help visitors make more informed buying decisions online.",
  },
  {
    question: "How can I contact UrugoBuy if I need help?",
    answer: "You can visit the Contact Us page, use the contact form, or email us directly at urugobuy@gmail.com for general support and questions.",
  },
] as const;

export default function Home() {
  const { t, formatCurrency } = useI18n();
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UrugoBuy",
    url: typeof window !== "undefined" ? window.location.origin : "/",
    description: t("home.metaDescription"),
    potentialAction: {
      "@type": "SearchAction",
      target: typeof window !== "undefined"
        ? `${window.location.origin}/shop?search={search_term_string}`
        : "/shop?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  useSeo(
    t("home.metaTitle"),
    t("home.metaDescription"),
    {
      canonicalPath: "/",
      image: "/logo-house.png",
      type: "website",
      keywords: ["fresh fruits", "online grocery", "food delivery", "fresh produce", "UrugoBuy"],
      jsonLd: homeJsonLd,
    },
  );
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { data: featuredProducts, isLoading: isProductsLoading } = useProducts({ featured: true });
  const { data: allProducts = [] } = useProducts();
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist();
  const subscribeMutation = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);
  const { data: promotions = [] } = useQuery({
    queryKey: ["home-promotions"],
    queryFn: async () => {
      const res = await fetch("/api/promotions");
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ id: number; name: string; type: string; value: string; endsAt: string }>>;
    },
  });

  const recentlyViewedProducts = allProducts.filter((product) => recentlyViewedIds.includes(product.id)).slice(0, 4);
  const recentlyViewedSet = new Set(recentlyViewedIds);
  const recentlyViewedCategories = new Set(
    recentlyViewedProducts
      .map((product) => product.categoryId)
      .filter((value): value is number => value !== null),
  );
  const wishlistCategorySet = new Set(
    wishlist
      .map((product: { categoryId?: number | null }) => product.categoryId)
      .filter((value: number | null | undefined): value is number => value !== null && value !== undefined),
  );
  const recommendedProducts = allProducts
    .filter((product) => !recentlyViewedSet.has(product.id))
    .sort((a, b) => {
      const aCategoryBoost = recentlyViewedCategories.has(a.categoryId ?? -1) ? 1 : 0;
      const bCategoryBoost = recentlyViewedCategories.has(b.categoryId ?? -1) ? 1 : 0;
      const aWishlistBoost = wishlistCategorySet.has(a.categoryId ?? -1) ? 1 : 0;
      const bWishlistBoost = wishlistCategorySet.has(b.categoryId ?? -1) ? 1 : 0;
      return (
        bWishlistBoost - aWishlistBoost ||
        bCategoryBoost - aCategoryBoost ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        Number(b.rating) - Number(a.rating) ||
        Number(a.price) - Number(b.price)
      );
    })
    .slice(0, 4);
  const flashPromotions = promotions.slice(0, 2);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recently-viewed-products");
      const ids = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) setRecentlyViewedIds(ids.filter((v) => Number.isFinite(v)));
    } catch {
      setRecentlyViewedIds([]);
    }
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeMutation.mutate({ email }, {
      onSuccess: () => setEmail("")
    });
  };

  return (
    <div className="min-h-screen pt-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted via-background to-background" />
        <div className="pointer-events-none absolute right-[4%] top-12 hidden lg:block">
          <div className="cloud-orbit">
            <div className="hero-cloud scale-90" />
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-muted text-muted-foreground mb-6 border border-border">
              <span className="flex w-2 h-2 rounded-full bg-primary mr-2"></span>
              {t("home.badge")}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-balance leading-[1.1] mb-6">
              {t("home.heroTitleA")} <br className="hidden sm:block" />
              <span className="text-muted-foreground">{t("home.heroTitleB")}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl text-balance leading-relaxed">
              {t("home.heroBody")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full text-base h-14 px-8" asChild>
                <Link href="/shop">
                  {t("home.shopFresh")} <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8 border-border" asChild>
                <Link href="/shop?featured=true">{t("home.bestSellers")}</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              {t("home.heroFootnote")}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] rounded-[2rem] overflow-hidden bg-muted border border-border/50 shadow-2xl"
          >
            <div className="pointer-events-none absolute left-5 top-5 z-10 sm:left-6 sm:top-6">
              <div className="rounded-[1.75rem] border border-white/65 bg-white/72 px-4 py-3 shadow-[0_24px_60px_rgba(15,107,75,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-background/55">
                <div className="flex items-center gap-3">
                  <div className="hero-cloud scale-[0.72] origin-left" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-20 rounded-full bg-primary/18 dark:bg-primary/28" />
                    <div className="h-2 w-14 rounded-full bg-accent/45 dark:bg-accent/35" />
                  </div>
                </div>
              </div>
            </div>
            {/* landing page hero fruits and food */}
            <img 
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2070&auto=format&fit=crop"
              alt="Fresh fruits and food essentials arranged for daily grocery shopping"
              loading="eager"
              fetchPriority="high"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8 py-8">
          {[
            { value: "About", label: "Clear business information and site mission" },
            { value: "Policies", label: "Visible privacy and terms pages" },
            { value: "Guides", label: "Original shopping content for visitors" },
            { value: "Support", label: "Contact pathways for questions and help" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-background/80 px-5 py-4">
              <p className="font-display text-3xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-2">{t("home.dealsEyebrow")}</p>
              <h2 className="font-display text-3xl font-bold mb-2">{t("home.dealsTitle")}</h2>
              <p className="text-muted-foreground max-w-2xl">{t("home.dealsBody")}</p>
            </div>
            <div className="flex gap-3">
              <Button className="rounded-full" asChild>
                <Link href="/deals">{t("home.viewDeals")}</Link>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <Link href="/checkout">{t("home.useCoupon")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {flashPromotions.length > 0 && (
        <section className="py-10 bg-background border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-2">
              {flashPromotions.map((promotion) => {
                const hoursLeft = Math.max(0, Math.ceil((new Date(promotion.endsAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                return (
                  <div key={promotion.id} className="rounded-[2rem] border border-border bg-card p-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-2">Flash sale</p>
                      <h2 className="font-display text-2xl font-bold mb-1">{promotion.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {promotion.type.toUpperCase()} offer live now with about {hoursLeft} hour{hoursLeft === 1 ? "" : "s"} left.
                      </p>
                    </div>
                    <Button className="rounded-full shrink-0" asChild>
                      <Link href="/deals">Shop deal</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-2">{t("home.globalEyebrow")}</p>
                <h2 className="font-display text-3xl font-bold mb-2">{t("home.globalTitle")}</h2>
                <p className="text-muted-foreground max-w-3xl">{t("home.globalBody")}</p>
              </div>
              <Button variant="outline" className="rounded-full shrink-0" asChild>
                <Link href="/international-shopping">{t("home.globalCta")}</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { code: "US", label: "English", note: "USD • domestic shipping" },
                { code: "FR", label: "Francais", note: "EUR • VAT-aware checkout" },
                { code: "AE", label: "Arabic", note: "AED • RTL storefront" },
                { code: "RW", label: "Kinyarwanda", note: "RWF • Rwanda-ready flow" },
              ].map((entry) => (
                <div key={entry.code} className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm text-primary/70">{entry.code}</p>
                  <p className="font-display text-2xl font-semibold mt-1">{entry.label}</p>
                  <p className="text-sm text-muted-foreground mt-2">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-background border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">{t("home.shopByCategory")}</h2>
              <p className="text-muted-foreground">{t("home.findCategory")}</p>
            </div>
          </div>
          
          {isCategoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories?.slice(0, 4).map((category, idx) => (
                <Link key={category.id} href={`/shop?categoryId=${category.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={category.imageUrl || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80`} 
                      alt={category.name}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <h3 className="font-display text-2xl font-bold text-white mb-2">{category.name}</h3>
                      <span className="inline-flex items-center text-white/80 text-sm font-medium opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {t("home.explore")} <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("home.featuredTitle")}</h2>
              <p className="text-muted-foreground max-w-xl">{t("home.featuredBody")}</p>
            </div>
            <Button variant="outline" className="rounded-full rounded-r-full shrink-0" asChild>
              <Link href="/shop?featured=true">{t("home.viewAll")}</Link>
            </Button>
          </div>

          {isProductsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {recommendedProducts.length > 0 && (
        <section className="py-20 bg-background border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold mb-2">{user ? `Picked for ${user.name.split(" ")[0]}` : t("home.recommendedTitle")}</h2>
                <p className="text-muted-foreground max-w-2xl">
                  {wishlist.length > 0
                    ? "Blended from your wishlist folders, recent browsing, and featured products."
                    : t("home.recommendedBody")}
                </p>
              </div>
              <Button variant="outline" className="rounded-full shrink-0" asChild>
                <Link href="/compare">{t("home.compareCta")}</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Why shop with UrugoBuy</h2>
              <p className="text-muted-foreground max-w-2xl">
                UrugoBuy is being shaped to feel like a complete business website, not just a product grid. We focus on
                clearer information, trustworthy navigation, and helpful content that supports better decisions.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Clear information",
                body: "Product pages, contact details, legal pages, and support routes are easier to find and understand.",
              },
              {
                title: "Helpful buying guidance",
                body: "Shopping guides and FAQ content make the site more useful for visitors who are still deciding what to buy.",
              },
              {
                title: "Simple support paths",
                body: "Visitors can move from browsing to checkout with clearer expectations about ordering, delivery, and help.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-muted/20 p-6">
                <h3 className="font-display text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-3xl font-bold mb-2">How ordering works</h2>
            <p className="text-muted-foreground">
              The buying process is simple by design so visitors can understand what happens before, during, and after checkout.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: FileText, title: "1. Browse", body: "Review categories, product descriptions, and featured collections." },
              { icon: ShieldCheck, title: "2. Check details", body: "Read delivery information, policies, and product details before adding items." },
              { icon: BadgeHelp, title: "3. Place your order", body: "Use checkout to confirm your basket, contact details, and preferred fulfillment option." },
              { icon: Truck, title: "4. Follow updates", body: "Use tracking and support pages if you need order progress or help after checkout." },
            ].map((step) => (
              <section key={step.title} className="rounded-3xl border border-border bg-card p-6">
                <step.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="py-20 bg-background border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="font-display text-3xl font-bold mb-2">{t("home.recentlyViewed")}</h2>
              <p className="text-muted-foreground">{t("home.recentlyViewedBody")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {recentlyViewedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Shopping guides</h2>
              <p className="text-muted-foreground max-w-2xl">
                Original articles help visitors evaluate products and shop more confidently, which also makes the site more useful than a thin catalog.
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/blog">Visit the blog</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {shoppingGuides.map((guide, idx) => (
              <motion.article
                key={guide.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-primary/70 mb-4">Guide</p>
                <h3 className="font-display text-xl font-semibold mb-3">{guide.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{guide.excerpt}</p>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href={`/blog/${guide.slug}`}>
                    Read article <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background border-t border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold mb-2">Frequently asked questions</h2>
            <p className="text-muted-foreground">
              These quick answers help new visitors understand how UrugoBuy works before they continue to shop.
            </p>
          </div>
          <div className="space-y-4">
            {homeFaqs.map((item) => (
              <section key={item.question} className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-display text-2xl font-semibold mb-3">{item.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-24 premium-surface text-foreground relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("home.joinClub")}</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            {t("home.newsletterBody")}
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder={t("home.emailPlaceholder")} 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-full bg-background/90 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25 backdrop-blur-sm"
            />
            <Button 
              type="submit" 
              size="lg" 
              disabled={subscribeMutation.isPending}
              className="h-14 rounded-full px-8"
            >
              {subscribeMutation.isPending ? t("home.subscribing") : t("home.subscribe")}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
