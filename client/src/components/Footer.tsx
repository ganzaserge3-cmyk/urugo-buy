import { Link } from "wouter";
import { Github, Twitter, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-muted/30 pt-16 pb-8 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-4 font-display font-bold tracking-tighter mb-4">
              <img src="/logo-house.png" alt="UrugoBuy logo" className="h-20 w-20 sm:h-16 sm:w-16 rounded-xl object-cover shadow-sm" />
              <div className="leading-none">
                <span className="brand-logo-text text-5xl sm:text-4xl">UrugoBuy<span className="text-primary/50">.</span></span>
                <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-muted-foreground mt-1">
                  {t("brand.tagline")}
                </p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>
          </div>
          
          <div>
            <h4 className="font-display font-semibold mb-6">{t("footer.shop")}</h4>
            <ul className="space-y-3">
              <li><Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.allProducts")}</Link></li>
              <li><Link href="/shop?featured=true" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.featured")}</Link></li>
              <li><Link href="/shop?categoryId=1" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.fruits")}</Link></li>
              <li><Link href="/shop?categoryId=2" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.foods")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-semibold mb-6">{t("footer.company")}</h4>
            <ul className="space-y-3">
              <li><Link href="/about-us" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.about")}</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.careers")}</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.privacy")}</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.terms")}</Link></li>
              <li><Link href="/account" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.account")}</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t("footer.blog")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-6">{t("footer.connect")}</h4>
            <div className="flex space-x-4 mb-6">
              <Button size="icon" variant="ghost" className="rounded-full bg-background border border-border hover:border-primary">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full bg-background border border-border hover:border-primary">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full bg-background border border-border hover:border-primary">
                <Github className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("footer.subscribe")}</p>
            <Link href="/" className="group inline-flex items-center text-sm font-medium hover:text-primary">
              {t("footer.newsletter")}
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} UrugoBuy Store. {t("footer.rights")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>{t("footer.precision")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

