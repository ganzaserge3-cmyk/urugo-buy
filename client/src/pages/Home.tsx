import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useSubscribeNewsletter } from "@/hooks/use-newsletter";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t, formatCurrency } = useI18n();
  useSeo(
    t("home.metaTitle"),
    t("home.metaDescription"),
    { canonicalPath: "/" },
  );
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { data: featuredProducts, isLoading: isProductsLoading } = useProducts({ featured: true });
  const { data: allProducts = [] } = useProducts();
  const subscribeMutation = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

  const recentlyViewedProducts = allProducts.filter((product) => recentlyViewedIds.includes(product.id)).slice(0, 4);

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
            { value: "24h", label: t("home.statRestock") },
            { value: "100+", label: t("home.statProducts") },
            { value: "4.9/5", label: t("home.statRating") },
            { value: formatCurrency(100), label: t("home.statShipping") },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-background/80 px-5 py-4">
              <p className="font-display text-3xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
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

      <section className="py-20 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">{t("home.whyTrust")}</h2>
              <p className="text-muted-foreground max-w-2xl">
                {t("home.whyTrustBody")}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: t("home.trustTotals"),
                body: t("home.trustTotalsBody"),
              },
              {
                title: t("home.trustStock"),
                body: t("home.trustStockBody"),
              },
              {
                title: t("home.trustTracking"),
                body: t("home.trustTrackingBody"),
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

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold mb-12 text-center">{t("home.testimonials")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Umwali ketia", role: t("home.customer"), text: "The fruit quality is always excellent and delivery is right on time every week." },
              { name: "Ganza Serge", role: "Home Cook", text: "Fresh ingredients and fair prices. It makes meal prep so much easier for my family." },
              { name: "Mvunije Cedric", role: "Fitness Coach", text: "I order weekly for clean eating plans. Produce arrives fresh and packed with care." }
            ].map((review, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-muted/50 border border-border"
              >
                <div className="flex space-x-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground text-lg mb-6 leading-relaxed">"{review.text}"</p>
                <div>
                  <h4 className="font-semibold">{review.name}</h4>
                  <p className="text-sm text-muted-foreground">{review.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 premium-surface text-foreground relative overflow-hidden border-t border-border/50">
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
