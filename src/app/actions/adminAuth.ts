"use server";

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";

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

export async function loginAdmin(password: string) {
  if (safeEqual(password.trim(), getPassword())) {
    (await cookies()).set(COOKIE_NAME, sessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    revalidatePath("/admin");
    return { success: true };
  }
  return { success: false, error: "Contraseña incorrecta" };
}

export async function logoutAdmin() {
  (await cookies()).delete(COOKIE_NAME);
  revalidatePath("/admin");
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
