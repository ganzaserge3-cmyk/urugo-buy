import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPolicy() {
  useI18n();
  useSeo("Privacy Policy - UrugoBuy", "Read how UrugoBuy may collect information, use cookies, work with analytics tools, and prepare for future advertising services.", {
    canonicalPath: "/privacy-policy",
    keywords: ["privacy policy", "cookies policy", "advertising disclosure", "data usage", "UrugoBuy privacy"],
    type: "website",
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">Privacy Policy for UrugoBuy</h1>
        <p className="mb-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Last updated:</span> April 1, 2026</p>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
          Welcome to <span className="font-medium text-foreground">UrugoBuy</span>. Your privacy is important to us.
          This Privacy Policy explains how we collect, use, and protect your information when you visit and use our website.
        </p>
        <p className="mb-8 text-muted-foreground">
          By using UrugoBuy, you agree to the terms outlined in this policy.
        </p>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We may collect different types of information, including:
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">a) Personal Information</h3>
                <p>When you interact with our website, you may provide:</p>
                <ul className="mt-2 space-y-2 list-disc pl-5">
                  <li>Your name</li>
                  <li>Email address</li>
                  <li>Phone number (if applicable)</li>
                  <li>Any information submitted through contact forms</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">b) Non-Personal Information</h3>
                <p>We may automatically collect:</p>
                <ul className="mt-2 space-y-2 list-disc pl-5">
                  <li>Browser type</li>
                  <li>Device information</li>
                  <li>IP address</li>
                  <li>Pages visited</li>
                  <li>Time spent on the website</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>Improve our website and services</li>
              <li>Respond to your inquiries</li>
              <li>Provide better user experience</li>
              <li>Monitor website performance</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">3. Cookies</h2>
            <p>
              UrugoBuy uses cookies to enhance your browsing experience.
            </p>
            <p className="mt-3">Cookies help us:</p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>Understand user behavior</li>
              <li>Remember preferences</li>
              <li>Improve site performance</li>
            </ul>
            <p className="mt-4">
              You can disable cookies through your browser settings if you prefer.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">4. Google AdSense and Advertising</h2>
            <p>
              We may use third-party advertising services, including Google AdSense, to display ads on this website.
            </p>
            <p className="mt-3">
              Google AdSense uses cookies (including the DoubleClick cookie) to:
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>Show ads based on your visits to this and other websites</li>
              <li>Deliver more relevant advertisements</li>
            </ul>
            <p className="mt-4">Users may opt out of personalized advertising by visiting:</p>
            <p className="mt-2 break-all text-foreground">https://www.google.com/settings/ads</p>
            <p className="mt-4">For more information, visit:</p>
            <p className="mt-2 break-all text-foreground">https://policies.google.com/technologies/ads</p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">5. Third-Party Services</h2>
            <p>
              We may use third-party services such as:
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>Analytics tools</li>
              <li>Advertising networks</li>
              <li>Hosting services</li>
            </ul>
            <p className="mt-4">
              These services may collect and process data according to their own privacy policies. We do not control how third-party services use your data.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">6. Data Security</h2>
            <p>
              We take reasonable steps to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">7. Links to Other Websites</h2>
            <p>
              Our website may contain links to external websites. We are not responsible for the privacy practices or content of those websites.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">8. Children’s Information</h2>
            <p>
              UrugoBuy does not knowingly collect personal information from children under the age of 13. If you believe a child has provided personal information, please contact us so we can remove it.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">9. Your Consent</h2>
            <p>
              By using our website, you consent to our Privacy Policy and agree to its terms.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy at any time. Changes will be posted on this page with an updated date.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, you can contact us:
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>Email: urugobuy@gmail.com</li>
              <li>Location: Kigali, Rwanda</li>
            </ul>
          </section>
        </div>

        <p className="mt-8 text-sm font-medium text-foreground">UrugoBuy - Your trusted online shopping platform.</p>
      </div>
    </div>
  );
}
