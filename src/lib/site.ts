import { headers } from "next/headers";

/**
 * Public base URL used for guest links and the check-in QR.
 * On Vercel, VERCEL_PROJECT_PRODUCTION_URL is a system variable (the production domain, e.g.
 * misxvkellyykyara.com), so links shared from any deployment always point to the real site.
 * Locally it falls back to the host of the current request.
 */
export async function getSiteUrl() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

export const invitationPath = (token: string) => `/i/${token}`;
export const checkInPath = (token: string) => `/admin/check-in?token=${encodeURIComponent(token)}`;
