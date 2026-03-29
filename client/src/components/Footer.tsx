import { Link } from "wouter";
import { ArrowRight, Github, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="premium-surface mt-auto border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-6 rounded-[2rem] border border-border bg-background/85 p-6 shadow-sm backdrop-blur md:grid-cols-[minmax(0,1.15fr)_auto] md:items-center md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">{t("footer.subscribe")}</p>
            <h3 className="mt-3 font-display text-3xl font-bold">Keep the storefront close.</h3>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Weekly offers, fresh arrivals, and product drops all flow through one calmer shopping experience.
            </p>
          </div>
          <Button className="rounded-full px-6" asChild>
            <Link href="/#newsletter">
              {t("footer.newsletter")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-4 font-display font-bold tracking-tighter">
              <img src="/logo-house.png" alt="UrugoBuy logo" className="h-20 w-20 rounded-xl object-cover shadow-sm sm:h-16 sm:w-16" />
              <div className="leading-none">
                <span className="brand-logo-text text-5xl sm:text-4xl">UrugoBuy<span className="text-primary/50">.</span></span>
                <p className="mt-1 text-[11px] font-semibold tracking-wide text-muted-foreground sm:text-xs">
                  {t("brand.tagline")}
                </p>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h4 className="mb-6 font-display font-semibold">{t("footer.shop")}</h4>
            <ul className="space-y-3">
              <li><Link href="/shop" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.allProducts")}</Link></li>
              <li><Link href="/shop?featured=true" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.featured")}</Link></li>
              <li><Link href="/category/fruits" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.fruits")}</Link></li>
              <li><Link href="/category/foods" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.foods")}</Link></li>
              <li><Link href="/deals" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.deals")}</Link></li>
              <li><Link href="/compare" className="text-sm text-muted-foreground transition-colors hover:text-primary">Compare Products</Link></li>
              <li><Link href="/track-order" className="text-sm text-muted-foreground transition-colors hover:text-primary">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-display font-semibold">{t("footer.company")}</h4>
            <ul className="space-y-3">
              <li><Link href="/about-us" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.about")}</Link></li>
              <li><Link href="/contact-us" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.contact")}</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.faq")}</Link></li>
              <li><Link href="/shipping-delivery" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.shipping")}</Link></li>
              <li><Link href="/international-shopping" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.international")}</Link></li>
              <li><Link href="/careers" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.careers")}</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.privacy")}</Link></li>
              <li><Link href="/terms-of-service" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.terms")}</Link></li>
              <li><Link href="/account" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.account")}</Link></li>
              <li><Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("footer.blog")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-display font-semibold">{t("footer.connect")}</h4>
            <div className="mb-6 flex space-x-4">
              <Button size="icon" variant="ghost" className="rounded-full border border-border bg-background hover:border-primary" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full border border-border bg-background hover:border-primary" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full border border-border bg-background hover:border-primary" aria-label="Github">
                <Github className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{t("footer.subscribe")}</p>
            <Link href="/#newsletter" className="group inline-flex items-center text-sm font-medium hover:text-primary">
              {t("footer.newsletter")}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} UrugoBuy Store. {t("footer.rights")}</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <span>{t("footer.precision")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
