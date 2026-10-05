"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAdmin } from "@/app/actions/adminAuth";
import { Ornament } from "@/components/decor";

/**
 * Login form. `next` is where to go after logging in; the check-in page passes its own URL
 * (with ?token=…) so a guard who scans a QR while logged out lands back on that pass.
 */
export const AdminLogin = ({ next = "/admin", pendingToken }: { next?: string; pendingToken?: string }) => {
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-navy px-4 watercolor-wash">
      <form action={formAction} className="card-gold w-full max-w-sm space-y-6 px-6 py-10 text-center">
        <input type="hidden" name="next" value={next} />
        <Ornament className="mx-auto h-6 w-36" />
        <div>
          <h1 className="font-serif text-2xl text-gold">Panel de control</h1>
          <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.3em] text-blue-mist">Acceso restringido</p>
        </div>

        {pendingToken && (
          <p className="border border-gold/30 bg-gold/10 px-3 py-2 font-sans text-sm text-blue-ice">
            Inicia sesión para registrar el pase <span className="font-mono tracking-wider text-gold">{pendingToken}</span>.
          </p>
        )}

        {state?.error && (
          <p role="alert" className="font-sans text-sm text-red-200">
            {state.error}
          </p>
        )}

        <div className="relative">
          <LockKeyhole size={16} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-blue-mist" />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            required
            autoFocus
            aria-label="Contraseña"
            className="input-gold pl-7 text-center"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-foil py-3.5 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy transition-opacity disabled:opacity-50"
        >
          {isPending ? "Entrando…" : "Entrar"}
        </button>

        <details className="group text-left">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center font-sans text-xs text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline [&::-webkit-details-marker]:hidden">
            ¿No sabes la contraseña?
          </summary>
          <p className="mt-2 font-sans text-xs leading-relaxed text-blue-ice/80">
            La contraseña es la que se guardó al publicar el sitio. Quien administra la página puede verla o cambiarla en{" "}
            <strong className="font-medium text-gold">Vercel → Settings → Environment Variables</strong>, en la variable{" "}
            <code className="font-mono text-gold">ADMIN_PASSWORD</code>. Después de cambiarla hay que volver a publicar el sitio
            (Deployments → Redeploy).
          </p>
        </details>
      </form>
    </main>
  );
};
