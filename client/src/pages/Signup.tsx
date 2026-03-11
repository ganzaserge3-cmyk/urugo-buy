import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { auth } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n";

export default function Signup() {
  const { t } = useI18n();
  useSeo(t("auth.signupMetaTitle"), t("auth.signupMetaDescription"), { canonicalPath: "/signup" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signup } = useAuth();
  const firebaseEnabled = Boolean(auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({
        variant: "destructive",
        title: t("auth.passwordsMismatch"),
        description: t("auth.passwordsMismatchBody"),
      });
      return;
    }
    setIsLoading(true);
    try {
      await signup(form);
      toast({
        title: t("auth.accountCreated"),
        description: t("auth.accountCreatedBody"),
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("auth.signupFailed"),
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 premium-surface">
      <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-stretch">
        <section className="order-2 lg:order-1 border border-border rounded-[2rem] p-8 bg-card shadow-sm">
        <h2 className="font-display text-3xl font-bold mb-2">{t("auth.createAccount")}</h2>
        <p className="text-muted-foreground mb-4">{t("auth.signupBody")}</p>
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">
            {firebaseEnabled ? t("auth.firebaseEnabledSignup") : t("auth.firebaseDisabledSignup")}
          </p>
          <p className="text-muted-foreground mt-1">
            {firebaseEnabled
              ? t("auth.firebaseEnabledBodySignup")
              : t("auth.firebaseDisabledBody")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={t("auth.fullName")}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder={t("auth.email")}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder={t("auth.password")}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder={t("auth.confirmPassword")}
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" className="w-full rounded-full" disabled={isLoading || !firebaseEnabled}>
            <UserPlus className="w-4 h-4 mr-2" />
            {isLoading ? t("auth.creating") : t("auth.createEmail")}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-5">
          {t("auth.alreadyHave")}{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t("auth.customerPathSignup")}</p>
          <p>{t("auth.customerPathSignupBody")}</p>
          <p>{t("auth.passwordMatch")} <span className={form.password && form.confirmPassword && form.password === form.confirmPassword ? "text-green-600" : "text-muted-foreground"}>{form.password && form.confirmPassword ? (form.password === form.confirmPassword ? t("auth.passwordConfirmed") : t("auth.passwordMismatch")) : t("auth.passwordPrompt")}</span></p>
        </div>
        </section>

        <section className="order-1 lg:order-2 rounded-[2rem] border border-border bg-card/90 p-8 md:p-10 backdrop-blur-sm">
          <div className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            {t("auth.secureTitle")}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-6 mb-3 text-balance">{t("auth.signupTitle")}</h1>
          <p className="text-muted-foreground text-lg max-w-xl">{t("auth.signupBody")}</p>
          <div className="mt-8 grid gap-3">
            {[t("auth.secureBullet1"), t("auth.secureBullet2"), t("auth.secureBullet3")].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
