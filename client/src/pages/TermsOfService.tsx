import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

const sections = [
  {
    title: "1. Acceptance of These Terms",
    body: [
      "By accessing or using UrugoBuy, you agree to be bound by these Terms & Conditions and by any other policies referenced on the website, including the Privacy Policy and any support or checkout notices that may apply to your use of the platform.",
      "If you do not agree with these terms, you should stop using the website. UrugoBuy may update these terms from time to time, and your continued use of the website after updates are published means that you accept the revised version.",
    ],
  },
  {
    title: "2. Website Scope and Business Use",
    body: [
      "UrugoBuy is an e-commerce and content platform that may include product listings, checkout tools, account features, support forms, shopping guides, legal pages, and informational content. Not every page should be interpreted as a fixed commercial offer in every circumstance.",
      "Features, categories, product availability, and site content may change over time for business, legal, technical, or operational reasons. Business details, support information, and policy text should always be read together with the most current version published on the website.",
    ],
  },
  {
    title: "3. Eligibility, Accounts, and Security",
    body: [
      "You represent that you have the legal capacity to use the website and, where applicable, place orders through it. If you create an account, you must provide accurate information and keep your login credentials secure.",
      "You are responsible for account activity carried out using your credentials unless you promptly report unauthorized access. UrugoBuy may suspend, limit, or review accounts where misuse, fraud risk, false information, or security concerns are reasonably suspected.",
      "Where account tools are provided, users are expected to keep their contact details reasonably current so that support, order, or security communication can be handled more effectively.",
    ],
  },
  {
    title: "4. Product Content, Pricing, and Availability",
    body: [
      "UrugoBuy aims to present clear product descriptions, pricing, and availability information, but listings may occasionally contain omissions, temporary inaccuracies, or outdated details. Product photos may be illustrative, descriptions may be revised, and prices may change without notice unless otherwise required by law.",
      "The presence of a product on the website does not guarantee final availability or fulfillment. UrugoBuy may correct listing errors, remove items, update pricing, or restrict product availability where necessary.",
      "Product galleries, ratings, and descriptive content are intended to help users make better decisions, but they should still be reviewed carefully together with quantity, pack, delivery, and support information before checkout.",
    ],
  },
  {
    title: "5. Orders, Payments, and Verification",
    body: [
      "Submitting an order through UrugoBuy is a request to purchase and may be subject to review for availability, pricing consistency, payment status, delivery feasibility, and fraud prevention. Users are responsible for reviewing all order details before confirming checkout.",
      "Payment methods may vary depending on market, order type, and operational availability. Hosted payment steps, manual confirmation, or other external provider flows may be used. UrugoBuy is not responsible for independent errors, delays, or outages caused by third-party payment providers.",
      "UrugoBuy may request clarification or additional verification if an order appears incomplete, inconsistent, or unusually risky. In those situations, processing may pause until the issue is resolved.",
    ],
  },
  {
    title: "6. Delivery, Pickup, Returns, and Support",
    body: [
      "Delivery estimates, pickup windows, and shipping fees are informational and may change depending on operational conditions, courier performance, stock readiness, and address quality. Users are responsible for providing complete and accurate delivery information.",
      "Return requests, order issues, support submissions, and cancellation requests may be reviewed according to timing, product condition, payment status, and any applicable support rules in place at the time. The presence of support tools does not guarantee approval of every request.",
      "Where tracking, support messaging, or contact tools are available, they are meant to assist communication and order follow-up, but response timing can still vary based on operational volume and the type of request received.",
    ],
  },
  {
    title: "7. User Responsibilities and Prohibited Conduct",
    body: [
      "Users must not use UrugoBuy unlawfully or in a way that disrupts the platform, harms other users, or undermines the integrity of the business. Prohibited conduct includes unauthorized access, false submissions, abusive behavior, scraping, malicious code, misuse of promotions, and attempts to interfere with site operations.",
      "UrugoBuy may investigate suspected misuse and take action including content removal, account restriction, order cancellation, service refusal, or other protective steps where reasonably necessary.",
    ],
  },
  {
    title: "8. Third-Party Services and External Links",
    body: [
      "UrugoBuy may rely on third-party services for hosting, payments, analytics, infrastructure, communication tools, and future advertising readiness. Those services may process data or provide functionality under their own terms and privacy policies.",
      "The website may also contain links to external websites. Once you leave UrugoBuy, your interactions with those websites are governed by their own terms, and UrugoBuy is not responsible for their content, availability, or privacy practices.",
      "Third-party integrations may change over time as the storefront evolves. Their availability, uptime, and behavior are not fully controlled by UrugoBuy.",
    ],
  },
  {
    title: "9. Editorial Content, Guides, and Informational Material",
    body: [
      "UrugoBuy may publish shopping guides, FAQs, educational articles, and other supporting content intended to help users navigate the website and make more informed buying decisions.",
      "This content is provided for general informational purposes and should not be interpreted as professional legal, medical, financial, or technical advice unless explicitly stated otherwise.",
      "Users should still review product details, pricing, policy pages, and support information directly before relying on any specific purchasing decision.",
    ],
  },
  {
    title: "10. Intellectual Property",
    body: [
      "Unless otherwise indicated, the website design, branding, content structure, editorial materials, interface components, and original text are owned by UrugoBuy or used with permission. Users may browse and use the site for normal personal and commercial shopping purposes, but may not reproduce or exploit protected materials without authorization except as allowed by law.",
      "Nothing in these terms transfers ownership of UrugoBuy intellectual property to users. Any limited right to use site materials is narrow, revocable, and restricted to normal platform use.",
      "Logos, page layouts, original article text, and other branded materials may not be copied in a way that suggests endorsement, partnership, or ownership without permission.",
    ],
  },
  {
    title: "11. Promotions, Discounts, and Limited Offers",
    body: [
      "UrugoBuy may offer promotions, discount codes, flash sales, loyalty rewards, referral incentives, or similar limited offers from time to time.",
      "Unless otherwise stated, promotional offers may be limited by time, quantity, eligibility, account status, order history, geography, or other operational rules. Misuse of offers may result in cancellation or disqualification.",
      "UrugoBuy may correct promotional errors, withdraw offers, or limit stacking and eligibility where necessary to protect the integrity of the storefront.",
    ],
  },
  {
    title: "12. Disclaimers and Limitation of Liability",
    body: [
      "The website and its materials are provided on an as-is and as-available basis to the fullest extent permitted by law. UrugoBuy does not guarantee uninterrupted access, perfect accuracy, or permanent feature availability. Content, guides, and product pages are intended to assist users, but they may evolve over time and should not be treated as guarantees unless clearly stated.",
      "To the maximum extent permitted by law, UrugoBuy will not be liable for indirect, incidental, or consequential losses arising from website use, service interruption, third-party failure, content inaccuracy, or inability to use the website. Where liability cannot be excluded, it should be limited to the amount actually paid, if any, for the specific transaction directly giving rise to the claim, unless law requires otherwise.",
      "Nothing in these terms is intended to exclude rights or remedies that cannot lawfully be excluded under applicable consumer protection rules.",
    ],
  },
  {
    title: "13. Privacy, Data Handling, and Communication",
    body: [
      "Use of the website is also subject to the UrugoBuy Privacy Policy, which explains how information may be collected, used, and protected in connection with the storefront and related services.",
      "By using UrugoBuy features such as account tools, checkout flows, newsletter forms, or support forms, users acknowledge that relevant information may be processed to provide those services.",
      "Business, support, and service-related communication may be sent where reasonably necessary to fulfill requests, respond to orders, or maintain account and security functionality.",
    ],
  },
  {
    title: "14. Changes, Governing Framework, and Contact",
    body: [
      "UrugoBuy may revise these Terms & Conditions to reflect changes in the business, legal requirements, site structure, support model, advertising readiness, or platform functionality. Updated versions may be posted on this page together with a revised date.",
      "These Terms & Conditions are intended to provide a clear working framework for how UrugoBuy operates online. If you have questions about these terms, please use the Contact Us page and include any relevant order details where applicable.",
      "Continued use of the website after updated terms are published means that the revised version will apply to future use of the platform to the extent permitted by law.",
    ],
  },
];

export default function TermsOfService() {
  useI18n();
  useSeo(
    "Terms & Conditions - UrugoBuy",
    "Review the expanded terms for using UrugoBuy, including site access, products, pricing, orders, payments, delivery, support, and liability limits.",
    {
      canonicalPath: "/terms-of-service",
      keywords: ["terms and conditions", "terms of service", "store terms", "UrugoBuy terms"],
      type: "website",
    },
  );

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-border bg-card px-6 py-10 md:px-10 md:py-12">
          <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">Terms & Conditions</h1>
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Last updated:</span> April 1, 2026
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground">
            These Terms & Conditions explain how visitors may use UrugoBuy, how orders and product information are handled,
            and what responsibilities apply when using the website. They are written to help the storefront feel clearer,
            more transparent, and more complete for both shoppers and the business.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              "Website use and account expectations",
              "Product, pricing, and order terms",
              "Delivery, support, and promotional rules",
              "Privacy, liability, and policy updates",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">{section.title}</h2>
              <div className="space-y-4">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm font-medium text-foreground">
          UrugoBuy - clearer policies help create a more trustworthy shopping experience.
        </p>
      </div>
    </div>
  );
}
