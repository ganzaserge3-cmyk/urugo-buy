import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, ensureFirebaseAuth } from "@/lib/firebase";

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "ganzaserge3@gmail.com").toLowerCase();

type AuthUser = {
  name: string;
  email: string;
  role: "customer" | "admin";
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async ({ email, password }) => {
        const normalizedEmail = email.toLowerCase();
        const adminLoginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (adminLoginRes.ok) {
          const data = await adminLoginRes.json();
          set({
            user: data.user,
            token: data.token,
          });
          return;
        }

        if (normalizedEmail === adminEmail) {
          const payload = await adminLoginRes.json().catch(() => ({ message: "Login failed" }));
          throw new Error(payload.message || "Login failed");
        }

        if (adminLoginRes.status && adminLoginRes.status !== 401) {
          const payload = await adminLoginRes.json().catch(() => ({ message: "Login failed" }));
          throw new Error(payload.message || "Login failed");
        }

        try {
          const firebaseAuth = ensureFirebaseAuth();
          const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
          const fbUser = credential.user;
          const idToken = await fbUser.getIdToken();
          set({
            user: {
              name: fbUser.displayName || fbUser.email?.split("@")[0] || "Customer",
              email: fbUser.email || email,
              role: "customer",
            },
            token: `firebase-id:${idToken}`,
          });
          return;
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Login failed");
        }
      },
      signup: async ({ name, email, password, confirmPassword }) => {
        if (!name || !email || !password || !confirmPassword) {
          throw new Error("All fields are required.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const firebaseAuth = ensureFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (firebaseAuth.currentUser) {
          await updateProfile(firebaseAuth.currentUser, { displayName: name });
        }
        const fbUser = credential.user;
        const idToken = await fbUser.getIdToken();
        set({
          user: {
            name: fbUser.displayName || name,
            email: fbUser.email || email,
            role: "customer",
          },
          token: `firebase-id:${idToken}`,
        });
      },
      logout: () => {
        const token = get().token;
        if (token && !token.startsWith("firebase-id:")) {
          fetch("/api/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => undefined);
        }
        if (auth) {
          signOut(auth).catch(() => undefined);
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-user",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
