import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function AboutUs() {
  const { t } = useI18n();
  useSeo(t("content.about.title"), t("content.about.body"), { canonicalPath: "/about" });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("content.about.title")}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t("content.about.body")}</p>
      </div>
    </div>
  );
}
