"use client";

import { useRef, useState } from "react";
import { DoorOpen, Image as ImageIcon, LogOut, Users, X } from "lucide-react";
import { logoutAdmin } from "@/app/actions/adminAuth";
import { GuestsPanel } from "./GuestsPanel";
import { PhotosPanel } from "./PhotosPanel";
import { ReceptionPanel } from "./ReceptionPanel";
import type { AdminInvitation, AdminMedia } from "./types";

export type AdminTab = "invitados" | "fotos" | "recepcion";

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "invitados", label: "Invitados", icon: Users },
  { id: "fotos", label: "Fotografías", icon: ImageIcon },
  { id: "recepcion", label: "Recepción", icon: DoorOpen },
];

export const AdminDashboard = ({
  invitations,
  media,
  siteUrl,
  initialTab,
  usingDefaultPassword,
}: {
  invitations: AdminInvitation[];
  media: AdminMedia[];
  siteUrl: string;
  initialTab: AdminTab;
  usingDefaultPassword: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = (message: string) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    // Keep the tab in the URL so a refresh (or "back to panel" from check-in) lands on it.
    window.history.replaceState(null, "", tab === "invitados" ? "/admin" : `/admin?tab=${tab}`);
  };

  return (
    <div className="min-h-screen w-full bg-navy-deep text-blue-ice">
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-baseline gap-3">
            <span className="font-script text-2xl text-gold">Kelly &amp; Kyara</span>
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-mist">Panel</span>
          </div>
          <form action={logoutAdmin}>
            <button className="inline-flex items-center gap-2 px-2 py-2 font-sans text-xs text-blue-mist transition-colors hover:text-red-200">
              <LogOut size={15} /> <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="Secciones del panel">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-sans text-sm transition-colors ${
                activeTab === id ? "border-gold text-gold" : "border-transparent text-blue-mist hover:text-blue-ice"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>

      {usingDefaultPassword && (
        <div className="border-b border-amber-300/30 bg-amber-400/10 px-4 py-2 text-center font-sans text-xs text-amber-100">
          Estás usando la contraseña por defecto. Configura la variable <code className="font-mono">ADMIN_PASSWORD</code> en Vercel para proteger el panel.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeTab === "invitados" && <GuestsPanel invitations={invitations} siteUrl={siteUrl} notify={notify} />}
        {activeTab === "fotos" && <PhotosPanel media={media} notify={notify} />}
        {activeTab === "recepcion" && <ReceptionPanel invitations={invitations} notify={notify} />}
      </main>

      {notice && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 border border-gold/40 bg-navy px-4 py-3 shadow-2xl">
          <p className="flex-1 font-sans text-sm text-blue-ice">{notice}</p>
          <button onClick={() => setNotice(null)} className="text-blue-mist hover:text-gold" aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
