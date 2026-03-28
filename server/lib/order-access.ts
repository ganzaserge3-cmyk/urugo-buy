import jwt from "jsonwebtoken";

type OrderAccessPayload = {
  orderId: number;
  email: string;
  purpose: "order_access";
};

const DEFAULT_ORDER_ACCESS_EXPIRES_IN = "30d";

function getOrderAccessSecret() {
  return process.env.ORDER_ACCESS_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET || "dev-order-access-secret-change-me";
}

export function signOrderAccessToken(orderId: number, email: string) {
  const expiresIn = (process.env.ORDER_ACCESS_EXPIRES_IN || DEFAULT_ORDER_ACCESS_EXPIRES_IN) as jwt.SignOptions["expiresIn"];
  return jwt.sign(
    {
      orderId,
      email,
      purpose: "order_access",
    } satisfies OrderAccessPayload,
    getOrderAccessSecret(),
    {
      expiresIn,
    },
  );
}

export function verifyOrderAccessToken(token: string | null | undefined): OrderAccessPayload | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getOrderAccessSecret());
    if (!decoded || typeof decoded !== "object") return null;

    const orderId = typeof decoded.orderId === "number" ? decoded.orderId : null;
    const email = typeof decoded.email === "string" ? decoded.email : null;
    const purpose = decoded.purpose === "order_access" ? decoded.purpose : null;

    if (!orderId || !email || !purpose) return null;
    return { orderId, email, purpose };
  } catch {
    return null;
  }
}
