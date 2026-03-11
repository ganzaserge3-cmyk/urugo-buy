import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { auth } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "ganzaserge3@gmail.com";

export default function Login() {
  const { t } = useI18n();
  useSeo(t("auth.loginMetaTitle"), t("auth.loginMetaDescription"), { canonicalPath: "/login" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const firebaseEnabled = Boolean(auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast({
        title: t("auth.loggedIn"),
        description: t("auth.welcomeBack"),
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("auth.loginFailed"),
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 premium-surface">
      <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
        <section className="rounded-[2rem] border border-border bg-card/90 p-8 md:p-10 backdrop-blur-sm">
          <div className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            {t("auth.secureTitle")}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-6 mb-3 text-balance">{t("auth.loginTitle")}</h1>
          <p className="text-muted-foreground text-lg max-w-xl">{t("auth.loginBody")}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[t("auth.secureBullet1"), t("auth.secureBullet2"), t("auth.secureBullet3")].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="border border-border rounded-[2rem] p-8 bg-card shadow-sm">
        <h2 className="font-display text-3xl font-bold mb-2">{t("auth.signIn")}</h2>
        <p className="text-muted-foreground mb-4">{t("auth.loginBody")}</p>
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">
            {firebaseEnabled ? t("auth.firebaseEnabledLogin") : t("auth.firebaseDisabledLogin")}
          </p>
          <p className="text-muted-foreground mt-1">
            {firebaseEnabled
              ? t("auth.firebaseEnabledBodyLogin")
              : t("auth.firebaseDisabledBody")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full rounded-full" disabled={isLoading || !firebaseEnabled}>
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? t("auth.signingIn") : t("auth.signInEmail")}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-5">
          {t("auth.newHere")}{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            {t("auth.createAccount")}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          {t("auth.adminLogin", { email: adminEmail })}
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t("auth.customerPathLogin")}</p>
          <p>{t("auth.customerPathLoginBody1")}</p>
          <p>{t("auth.customerPathLoginBody2")}</p>
        </div>
        </div>
      </div>
    </div>
  );
}
