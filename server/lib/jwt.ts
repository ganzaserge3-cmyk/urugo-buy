import jwt from "jsonwebtoken";

export type JwtRole = "customer" | "admin";

export type SessionJwtPayload = {
  email: string;
  name: string;
  role: JwtRole;
};

const DEFAULT_EXPIRES_IN = "7d";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || "dev-jwt-secret-change-me";
}

export function signSessionToken(payload: SessionJwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN) as jwt.SignOptions["expiresIn"];
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
}

export function verifySessionToken(token: string): SessionJwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== "object") return null;

    const email = typeof decoded.email === "string" ? decoded.email : null;
    const name = typeof decoded.name === "string" ? decoded.name : null;
    const role = decoded.role === "admin" || decoded.role === "customer" ? decoded.role : null;

    if (!email || !name || !role) return null;
    return { email, name, role };
  } catch {
    return null;
  }
}
