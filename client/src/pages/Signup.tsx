import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";

export default function Signup() {
  useSeo("Sign Up - UrugoBuy", "Create a UrugoBuy account for faster checkout, tracking, referrals, and alerts.", { canonicalPath: "/signup" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signup } = useAuth();

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
        title: "Passwords do not match",
        description: "Please confirm the same password in both fields.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signup(form);
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-md mx-auto border border-border rounded-2xl p-8 bg-card">
        <h1 className="font-display text-3xl font-bold mb-2">Sign Up</h1>
        <p className="text-muted-foreground mb-6">Create your new account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
            <UserPlus className="w-4 h-4 mr-2" />
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
          <p>Create an account to track orders, redeem referrals, manage alerts, and speed up future checkout.</p>
          <p>Password match: <span className={form.password && form.confirmPassword && form.password === form.confirmPassword ? "text-green-600" : "text-muted-foreground"}>{form.password && form.confirmPassword ? (form.password === form.confirmPassword ? "Confirmed" : "Not matched yet") : "Enter and confirm your password"}</span></p>
        </div>
      </div>
    </div>
  );
}
