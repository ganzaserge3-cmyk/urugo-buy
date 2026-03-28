import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useSeo } from "@/hooks/use-seo";
import { getStoredLanguageCode, useI18n } from "@/lib/i18n";

const fallbackPages = {
  "contact-us": {
    en: {
      title: "Contact Us",
      description: "Reach our team for orders, support, partnerships, and wholesale requests.",
      body: "Need help with an order, delivery, or partnership? Email support@urugobuy.com or use the support area in your account. For wholesale and international requests, include your country, product needs, and expected volume so our team can help faster.",
    },
    fr: {
      title: "Contact",
      description: "Contactez notre equipe pour les commandes, le support, les partenariats et la vente en gros.",
      body: "Besoin d'aide pour une commande, une livraison ou un partenariat ? Ecrivez a support@urugobuy.com ou utilisez l'espace support dans votre compte. Pour les demandes de gros ou internationales, indiquez votre pays, vos besoins produits et le volume attendu.",
    },
    ar: {
      title: "اتصل بنا",
      description: "تواصل مع فريقنا بخصوص الطلبات والدعم والشراكات والطلبات بالجملة.",
      body: "إذا كنت بحاجة إلى مساعدة بخصوص طلب أو توصيل أو شراكة، راسل support@urugobuy.com أو استخدم قسم الدعم داخل حسابك. لطلبات الجملة أو الشحن الدولي، اذكر بلدك واحتياجاتك والكميات المتوقعة.",
    },
    rw: {
      title: "Tuvugishe",
      description: "Vugana n'itsinda ryacu ku bijyanye na commandes, support, ubufatanye n'ibicuruzwa byinshi.",
      body: "Ukeneye ubufasha kuri commande, delivery cyangwa ubufatanye? Andikira support@urugobuy.com cyangwa ukoreshe support iri muri konti yawe. Niba ushaka kugura byinshi cyangwa gutumiza mu kindi gihugu, shyiramo igihugu urimo, ibyo ukeneye n'ingano wifuza kugira ngo tugufashe vuba.",
    },
  },
  faq: {
    en: {
      title: "Frequently Asked Questions",
      description: "Quick answers about delivery, payments, returns, and support.",
      body: "Delivery times appear during checkout based on your market. Online payments can be resumed from the order page if a session expires. Returns can be requested from your account after delivery. If you need help quickly, use the support ticket section in your account.",
    },
    fr: {
      title: "Questions frequentes",
      description: "Reponses rapides sur la livraison, le paiement, les retours et le support.",
      body: "Les delais de livraison apparaissent pendant le paiement selon votre marche. Les paiements en ligne peuvent etre repris depuis la page de commande si la session expire. Les retours se demandent depuis votre compte apres livraison.",
    },
    ar: {
      title: "الأسئلة الشائعة",
      description: "إجابات سريعة حول التوصيل والدفع والإرجاع والدعم.",
      body: "تظهر أوقات التوصيل أثناء إتمام الشراء حسب سوقك. يمكن استئناف الدفع الإلكتروني من صفحة الطلب إذا انتهت الجلسة. يمكن طلب الإرجاع من حسابك بعد التسليم. وللمساعدة السريعة استخدم قسم تذكرة الدعم داخل حسابك.",
    },
    rw: {
      title: "Ibibazo bikunze kubazwa",
      description: "Ibisubizo byihuse ku kugemura, kwishyura, gusubiza ibicuruzwa na support.",
      body: "Igihe cyo kugemura kigaragara muri checkout bitewe n'isoko wahisemo. Uburyo bwo kwishyura online bushobora kongera gutangizwa ku ipaji ya order niba session irangiye. Gusubiza ibicuruzwa bikorwa muri konti nyuma yo kubyakira. Niba ushaka ubufasha bwihuse, koresha support ticket iri muri konti yawe.",
    },
  },
  "shipping-delivery": {
    en: {
      title: "Shipping and Delivery",
      description: "Learn how delivery slots, fees, and tracking work.",
      body: "Shipping fees are shown before payment and may change by country or basket size. Customers can choose delivery slots where available, and every order gets a tracking-ready page after checkout. For large or cross-border deliveries, our team may confirm timing separately.",
    },
    fr: {
      title: "Expedition et livraison",
      description: "Comprenez les frais, les creneaux et le suivi.",
      body: "Les frais de livraison sont affiches avant paiement et peuvent varier selon le pays ou la taille du panier. Les clients peuvent choisir un creneau lorsque c'est disponible, et chaque commande dispose d'une page de suivi apres paiement.",
    },
    ar: {
      title: "الشحن والتوصيل",
      description: "تعرف على مواعيد التوصيل والرسوم والتتبع.",
      body: "تظهر رسوم الشحن قبل الدفع وقد تختلف حسب البلد أو حجم السلة. يمكن للعملاء اختيار مواعيد التوصيل عندما تكون متاحة، وكل طلب يحصل على صفحة قابلة للتتبع بعد الشراء.",
    },
    rw: {
      title: "Kohereza no kugemura",
      description: "Menya uko delivery slots, amafaranga yo kohereza n'ikurikirana rya commandes bikora.",
      body: "Amafaranga yo kohereza agaragazwa mbere yo kwishyura kandi ashobora guhinduka bitewe n'igihugu cyangwa ingano y'ibyo uguze. Aho bishoboka ushobora guhitamo igihe cya delivery, kandi buri commande igira urupapuro rwo kuyikurikirana nyuma ya checkout.",
    },
  },
  "international-shopping": {
    en: {
      title: "International Shopping",
      description: "Information for customers buying across markets and currencies.",
      body: "UrugoBuy is being prepared for broader international use with localized language, currency, and content support. Market pricing, taxes, and delivery options may vary by country. If your region is not fully supported yet, contact us and we can help confirm availability and shipping approach.",
    },
    fr: {
      title: "Achats internationaux",
      description: "Informations pour les clients achetant entre differents marches et devises.",
      body: "UrugoBuy se prepare a un usage international plus large avec prise en charge de la langue, de la devise et du contenu localises. Les prix, taxes et options de livraison peuvent varier selon le pays. Contactez-nous si votre region n'est pas encore totalement prise en charge.",
    },
    ar: {
      title: "التسوق الدولي",
      description: "معلومات للعملاء الذين يشترون عبر أسواق وعملات مختلفة.",
      body: "يتم تجهيز UrugoBuy لاستخدام دولي أوسع مع دعم اللغة والعملة والمحتوى المحلي. قد تختلف الأسعار والضرائب وخيارات التوصيل حسب البلد. إذا لم تكن منطقتك مدعومة بالكامل بعد، تواصل معنا وسنساعدك.",
    },
    rw: {
      title: "Kugura mpuzamahanga",
      description: "Amakuru ku bakiriya bagura mu masoko n'ifaranga bitandukanye.",
      body: "UrugoBuy iri gutegurwa kugira ngo ikoreshwe n'abakiriya bo mu bihugu byinshi, harimo ururimi, ifaranga n'ibikubiye kuri site bihinduka bitewe n'isoko. Ibiciro, imisoro n'uburyo bwo kugemura bishobora gutandukana bitewe n'igihugu. Niba igihugu cyawe kitarashyigikirwa neza, twandikire tugufashe.",
    },
  },
} as const;

type ContentPageProps = {
  forcedSlug?: string;
};

export default function ContentPage({ forcedSlug }: ContentPageProps) {
  const { t, market, markets } = useI18n();
  const { slug = "" } = useParams<{ slug: string }>();
  const resolvedSlug = forcedSlug || slug;
  const currentLanguage = getStoredLanguageCode() as "en" | "fr" | "ar" | "rw";
  const [page, setPage] = useState<{ title: string; description: string; body: string } | null>(null);

  useEffect(() => {
    if (!resolvedSlug) {
      setPage(null);
      return;
    }
    fetch(`/api/content/pages/${resolvedSlug}?lang=${encodeURIComponent(getStoredLanguageCode())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => setPage(row || fallbackPages[resolvedSlug as keyof typeof fallbackPages]?.[currentLanguage] || fallbackPages[resolvedSlug as keyof typeof fallbackPages]?.en || null))
      .catch(() => setPage(fallbackPages[resolvedSlug as keyof typeof fallbackPages]?.[currentLanguage] || fallbackPages[resolvedSlug as keyof typeof fallbackPages]?.en || null));
  }, [currentLanguage, market.language, resolvedSlug]);

  useSeo(page ? `${page.title} - UrugoBuy` : t("content.metaTitle"), page?.description || t("content.metaDescription"));

  if (!page) {
    return <div className="min-h-screen pt-24 px-4">{t("content.notFound")}</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-bold mb-3">{page.title}</h1>
        <p className="text-muted-foreground mb-4">{page.description}</p>
        <article className="whitespace-pre-line leading-relaxed">{page.body}</article>
        {resolvedSlug === "international-shopping" && (
          <div className="mt-10 space-y-8">
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-3xl font-semibold mb-4">{t("content.international.featuresTitle")}</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="rounded-2xl border border-border bg-background p-4">
                    {t(`content.international.feature${index}`)}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-3xl font-semibold mb-2">{t("content.international.marketsTitle")}</h2>
              <p className="text-muted-foreground mb-4">{t("content.international.marketsBody")}</p>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {markets.map((entry) => (
                  <div key={entry.code} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm text-primary/70">{entry.code}</p>
                    <p className="font-display text-2xl font-semibold mt-1">{entry.label}</p>
                    <p className="text-sm text-muted-foreground mt-2">{entry.currency} • {entry.locale}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-3xl font-semibold mb-2">{t("content.international.supportTitle")}</h2>
              <p className="text-muted-foreground">{t("content.international.supportBody")}</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

