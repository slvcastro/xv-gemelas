"use client";

import { useRef, useState } from "react";
import { CircleHelp, DoorOpen, Image as ImageIcon, LogOut, Users, X } from "lucide-react";
import { logoutAdmin } from "@/app/actions/adminAuth";
import { FamiliesPanel } from "./FamiliesPanel";
import { HowItWorksSteps } from "./HowItWorks";
import { PhotosPanel } from "./PhotosPanel";
import { ReceptionPanel } from "./ReceptionPanel";
import { Modal, btnPrimary } from "./ui";
import type { AdminFamily, AdminMedia } from "./types";

export type AdminTab = "invitados" | "fotos" | "recepcion";

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "invitados", label: "Invitados", icon: Users },
  { id: "fotos", label: "Fotografías", icon: ImageIcon },
  { id: "recepcion", label: "Recepción", icon: DoorOpen },
];

export const AdminDashboard = ({
  families,
  media,
  siteUrl,
  deadline,
  initialTab,
  usingDefaultPassword,
}: {
  families: AdminFamily[];
  media: AdminMedia[];
  siteUrl: string;
  /** ISO date of the RSVP deadline, or null. */
  deadline: string | null;
  initialTab: AdminTab;
  usingDefaultPassword: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [showHelp, setShowHelp] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = (message: string) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  };

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    // Keep the tab in the URL so a refresh (or "back to panel" from check-in) lands on it.
    window.history.replaceState(null, "", tab === "invitados" ? "/admin" : `/admin?tab=${tab}`);
  };

  return (
    <div className="min-h-screen w-full bg-navy-deep text-blue-ice">
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="truncate font-script text-2xl text-gold">Kelly &amp; Kyara</span>
            <span className="hidden font-sans text-[10px] uppercase tracking-[0.3em] text-blue-mist min-[400px]:inline">Panel</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="inline-flex min-h-10 items-center gap-1.5 border border-gold/30 px-3 py-2 font-sans text-xs text-gold transition-colors hover:border-gold hover:bg-gold/10"
            >
              <CircleHelp size={15} aria-hidden="true" /> ¿Cómo funciona?
            </button>
            <form action={logoutAdmin}>
              <button
                className="inline-flex min-h-10 items-center gap-2 px-2 py-2 font-sans text-xs text-blue-mist transition-colors hover:text-red-200"
                aria-label="Cerrar sesión"
              >
                <LogOut size={15} aria-hidden="true" /> <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4" aria-label="Secciones del panel">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 py-3 font-sans text-sm transition-colors sm:px-4 ${
                activeTab === id ? "border-gold text-gold" : "border-transparent text-blue-mist hover:text-blue-ice"
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
      </header>

      {usingDefaultPassword && (
        <div className="border-b border-amber-300/30 bg-amber-400/10 px-4 py-2 text-center font-sans text-xs text-amber-100">
          Estás usando la contraseña de fábrica. Para poner la tuya: en Vercel → Settings → Environment Variables, crea{" "}
          <code className="font-mono">ADMIN_PASSWORD</code> y vuelve a publicar el sitio.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {activeTab === "invitados" && <FamiliesPanel families={families} siteUrl={siteUrl} deadline={deadline} notify={notify} />}
        {activeTab === "fotos" && <PhotosPanel media={media} notify={notify} />}
        {activeTab === "recepcion" && <ReceptionPanel families={families} notify={notify} />}
      </main>

      {showHelp && (
        <Modal title="¿Cómo funciona?" onClose={() => setShowHelp(false)}>
          <HowItWorksSteps compact />
          <button type="button" onClick={() => setShowHelp(false)} className={`${btnPrimary} mt-6 w-full`}>
            Entendido
          </button>
        </Modal>
      )}

      {notice && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 border border-gold/40 bg-navy px-4 py-3 shadow-2xl">
          <p className="flex-1 font-sans text-sm text-blue-ice">{notice}</p>
          <button type="button" onClick={() => setNotice(null)} className="-m-1 p-1 text-blue-mist hover:text-gold" aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
