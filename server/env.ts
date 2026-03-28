const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "APP_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

const RECOMMENDED_SECRETS = [
  "JWT_SECRET",
  "SESSION_SECRET",
  "TWO_FACTOR_SECRET",
  "DEMO_WEBHOOK_SECRET",
];

const PLACEHOLDER_PASSWORDS = new Set([
  "change_this_admin_password",
  "GanzasergeAdmin2026!",
]);

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !hasValue(process.env[key]));
  const warnings: string[] = [];

  if (isProduction && missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  if (!hasValue(process.env.JWT_SECRET) && !hasValue(process.env.SESSION_SECRET)) {
    warnings.push("Set JWT_SECRET or SESSION_SECRET to avoid fallback development secrets.");
  }

  for (const key of RECOMMENDED_SECRETS) {
    if (!hasValue(process.env[key])) {
      warnings.push(`Recommended secret is missing: ${key}`);
    }
  }

  if (PLACEHOLDER_PASSWORDS.has(process.env.ADMIN_PASSWORD || "")) {
    warnings.push("ADMIN_PASSWORD is using a default or placeholder value.");
  }

  if (!hasValue(process.env.RESEND_API_KEY) || !(hasValue(process.env.RESEND_FROM) || hasValue(process.env.EMAIL_FROM))) {
    warnings.push("Email delivery is not fully configured. Set RESEND_API_KEY and RESEND_FROM or EMAIL_FROM.");
  }

  if (!hasValue(process.env.PAYPAL_CLIENT_ID) || !hasValue(process.env.PAYPAL_CLIENT_SECRET)) {
    warnings.push("PayPal live/sandbox credentials are missing. Online payments will stay in demo mode.");
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[env] ${warning}`);
    }
  }
}
