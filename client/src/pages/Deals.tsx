import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

type PromotionRow = {
  id: number;
  name: string;
  type: string;
  value: string;
  audience: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type CouponRow = {
  code: string;
  discountType: string;
  value: string;
  minSpend: string;
};

function formatPromotionValue(row: PromotionRow) {
  const amount = Number(row.value || 0);
  if (row.type === "percent") return `${amount}%`;
  if (row.type === "fixed") return `$${amount.toFixed(0)}`;
  if (row.type === "bogo") return "BOGO";
  return row.value;
}

export default function Deals() {
  const { t, formatDateTime } = useI18n();
  const { toast } = useToast();
  useSeo(t("deals.metaTitle"), t("deals.metaDescription"), { canonicalPath: "/deals" });

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["public-promotions"],
    queryFn: async () => {
      const res = await fetch("/api/promotions");
      if (!res.ok) throw new Error("Failed to load promotions");
      return res.json() as Promise<PromotionRow[]>;
    },
  });
  const { data: coupons = [] } = useQuery({
    queryKey: ["public-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/coupons/public");
      if (!res.ok) throw new Error("Failed to load coupons");
      return res.json() as Promise<CouponRow[]>;
    },
  });

  const handleCopyCoupon = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: t("deals.copiedTitle"), description: t("deals.copiedBody", { code }) });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-10">
        <section className="rounded-[2rem] border border-border bg-card overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] items-stretch">
            <div className="p-8 md:p-12">
              <p className="text-sm uppercase tracking-[0.24em] text-primary/70 mb-4">{t("deals.eyebrow")}</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("deals.title")}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{t("deals.body")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/shop?featured=true">{t("deals.shopFeatured")}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/checkout">{t("deals.goCheckout")}</Link>
                </Button>
              </div>
            </div>
            <div className="min-h-[280px] bg-gradient-to-br from-primary/15 via-accent/10 to-background flex items-center justify-center p-8">
              <div className="w-full max-w-md rounded-[2rem] border border-border bg-background/80 p-6 shadow-sm">
                <p className="text-sm text-muted-foreground mb-2">{t("deals.highlight")}</p>
                <p className="font-display text-4xl font-bold mb-3">{promotions.length}</p>
                <p className="text-muted-foreground">{t("deals.livePromotions")}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("deals.activeTitle")}</h2>
              <p className="text-muted-foreground mt-2">{t("deals.activeBody")}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-56 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <h3 className="font-display text-3xl font-bold mb-3">{t("deals.noneTitle")}</h3>
              <p className="text-muted-foreground mb-6">{t("deals.noneBody")}</p>
              <Button asChild className="rounded-full">
                <Link href="/shop">{t("deals.keepShopping")}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="rounded-[2rem] border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-primary/70 mb-2">{t("deals.live")}</p>
                      <h3 className="font-display text-2xl font-semibold">{promotion.name}</h3>
                    </div>
                    <div className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
                      {formatPromotionValue(promotion)}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t("deals.type", { value: promotion.type.toUpperCase() })}</p>
                    <p>{t("deals.audience", { value: promotion.audience })}</p>
                    <p>{t("deals.ends", { value: formatDateTime(promotion.endsAt) })}</p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button asChild className="rounded-full">
                      <Link href="/checkout">{t("deals.useAtCheckout")}</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/shop">{t("deals.browseProducts")}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("deals.couponTitle")}</h2>
              <p className="text-muted-foreground mt-2">{t("deals.couponBody")}</p>
            </div>
          </div>
          {coupons.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">{t("deals.noCoupons")}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div key={coupon.code} className="rounded-[2rem] border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-primary/70 mb-2">{t("deals.couponCode")}</p>
                      <h3 className="font-display text-2xl font-semibold">{coupon.code}</h3>
                    </div>
                    <div className="rounded-full bg-accent/20 text-foreground px-4 py-2 text-sm font-bold">
                      {coupon.discountType === "percent" ? `${Number(coupon.value)}%` : `$${Number(coupon.value).toFixed(0)}`}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t("deals.minSpend", { value: Number(coupon.minSpend).toFixed(2) })}</p>
                    <p>{t("deals.type", { value: coupon.discountType.toUpperCase() })}</p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button type="button" className="rounded-full" onClick={() => handleCopyCoupon(coupon.code)}>
                      {t("deals.copyCode")}
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/checkout?coupon=${encodeURIComponent(coupon.code)}`}>{t("deals.applyNow")}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
