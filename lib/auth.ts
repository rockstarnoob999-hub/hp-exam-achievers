import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { serialize, parse } from "cookie";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "hp_session";

export type SessionPayload = {
  id: string;
  role: "teacher" | "student";
  name: string;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearCookie() {
  return serialize(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSession(req: NextRequest): SessionPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}
