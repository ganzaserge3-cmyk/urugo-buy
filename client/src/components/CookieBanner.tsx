import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "urugobuy-cookie-consent";

type CookieConsentValue = "accepted" | "rejected";

function readConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setConsent(existing);
    setIsVisible(!existing);
  }, []);

  const saveConsent = (value: CookieConsentValue) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    }
    setConsent(value);
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && (
        <aside
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-[1.75rem] border border-border bg-background/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:bottom-6 sm:p-6"
          aria-label="Cookie consent banner"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Cookie Notice</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">We use cookies to improve your experience on UrugoBuy.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                We use essential cookies to keep the website secure, remember basic preferences, support core features such as cart and account flows,
                and understand overall site performance. With your permission, we may also use optional cookies for analytics and future advertising services.
                You can accept all cookies or reject non-essential cookies. To learn more, please review our{" "}
                <a href="/privacy-policy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </a>.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[220px]">
              <Button type="button" className="rounded-full" onClick={() => saveConsent("accepted")}>
                Accept cookies
              </Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => saveConsent("rejected")}>
                Reject non-essential
              </Button>
            </div>
          </div>
        </aside>
      )}

      {consent && !isVisible && (
        <button
          type="button"
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 left-4 z-40 rounded-full border border-border bg-background/95 px-4 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur hover:border-primary hover:text-primary sm:bottom-6 sm:left-6"
        >
          Cookie settings
        </button>
      )}
    </>
  );
}
