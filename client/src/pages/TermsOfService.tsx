import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function TermsOfService() {
  const { t } = useI18n();
  useSeo(t("content.terms.title"), t("content.terms.body"), { canonicalPath: "/terms" });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("content.terms.title")}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t("content.terms.body")}</p>
      </div>
    </div>
  );
}
