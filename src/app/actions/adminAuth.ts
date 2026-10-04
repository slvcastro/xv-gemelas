"use server";

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";

function getPassword() {
  return process.env.ADMIN_PASSWORD || "kellykyara2026";
}

// The cookie stores a hash derived from the password (never the password itself),
// so it can't be forged by simply writing "authenticated" in the browser.
function sessionValue() {
  const secret = process.env.DATABASE_URL || "xv-kelly-kyara";
  return createHash("sha256").update(`${getPassword()}::${secret}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Only allow returning to admin pages of this site (prevents open redirects via ?next=). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(?:[/?#]|$)/.test(next) && !next.includes("\\") ? next : "/admin";
}

export type LoginState = { error: string } | null;

/**
 * Form action for <AdminLogin>. On success sets the session cookie and redirects to `next`
 * (e.g. /admin/check-in?token=ABC123 when the door staff scanned a QR before logging in).
 */
export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "").trim();
  if (!password || !safeEqual(password, getPassword())) {
    // Small delay to slow down password guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Contraseña incorrecta" };
  }

  (await cookies()).set(COOKIE_NAME, sessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  redirect(safeNext(formData.get("next")));
}

export async function logoutAdmin() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/admin");
}

export async function checkAdmin() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return !!value && safeEqual(value, sessionValue());
}

/** Throws if the current request is not from a logged-in admin. */
export async function requireAdmin() {
  if (!(await checkAdmin())) {
    throw new Error("No autorizado");
  }
}
