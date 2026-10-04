"use client";

import { useState } from "react";
import { logoutAdmin } from "@/app/actions/adminAuth";
import { createInvitation } from "@/app/actions/adminGuests";
import { LogOut, Users, Settings, Image as ImageIcon, Plus } from "lucide-react";

export const AdminDashboard = ({ initialInvitations, allGuests }: any) => {
  const [activeTab, setActiveTab] = useState("guests");
  const [isAdding, setIsAdding] = useState(false);
  const [newInv, setNewInv] = useState({ name: "", maxGuests: 1, greeting: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInvitation(newInv.name, newInv.maxGuests, newInv.greeting);
    setNewInv({ name: "", maxGuests: 1, greeting: "" });
    setIsAdding(false);
  };

  const handleExportCSV = () => {
    // Basic CSV generation
    const headers = ["Familia/Grupo", "Cupo Máximo", "Estado", "Teléfono", "Invitado Registrado", "Restricciones Alimentarias"];
    let csvContent = headers.join(",") + "\n";

    initialInvitations.forEach((inv: any) => {
      const invGuests = allGuests.filter((g: any) => g.invitationId === inv.id);
      
      if (invGuests.length === 0) {
        // No guests yet
        csvContent += `"${inv.name}","${inv.maxGuests}","${inv.status}","${inv.phone || ''}","",""\n`;
      } else {
        // One row per guest
        invGuests.forEach((g: any) => {
          csvContent += `"${inv.name}","${inv.maxGuests}","${inv.status}","${inv.phone || ''}","${g.name}","${g.dietaryRestrictions || ''}"\n`;
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "invitados_xv.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-sand/10">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-ivory border-r border-taupe/20 flex flex-col">
        <div className="p-6 border-b border-taupe/20 text-center md:text-left">
          <h1 className="font-serif text-2xl text-espresso">Admin</h1>
          <p className="font-sans text-xs uppercase tracking-widest text-taupe mt-1">Kelly & Kyara</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          <button 
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-3 px-4 py-3 font-sans text-sm transition-colors rounded-none ${activeTab === "guests" ? "bg-espresso text-ivory" : "text-espresso/70 hover:bg-sand/30"}`}
          >
            <Users size={16} />
            <span className="hidden md:inline">Invitados</span>
          </button>
          <button 
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-3 px-4 py-3 font-sans text-sm transition-colors rounded-none ${activeTab === "photos" ? "bg-espresso text-ivory" : "text-espresso/70 hover:bg-sand/30"}`}
          >
            <ImageIcon size={16} />
            <span className="hidden md:inline">Fotografías</span>
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-4 py-3 font-sans text-sm transition-colors rounded-none ${activeTab === "settings" ? "bg-espresso text-ivory" : "text-espresso/70 hover:bg-sand/30"}`}
          >
            <Settings size={16} />
            <span className="hidden md:inline">Configuración</span>
          </button>
        </nav>

        <div className="p-4 border-t border-taupe/20">
          <button 
            onClick={() => logoutAdmin()}
            className="flex items-center gap-3 w-full px-4 py-3 font-sans text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === "guests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-serif text-3xl text-espresso">Lista de Invitados</h2>
                <p className="font-sans text-sm text-espresso/70 mt-1">Total de familias/grupos: {initialInvitations.length}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="bg-transparent border border-espresso text-espresso px-4 py-2 uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-espresso/5"
                >
                  Exportar CSV
                </button>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="bg-espresso text-ivory px-4 py-2 uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-espresso/90"
                >
                  <Plus size={14} /> Nuevo Grupo
                </button>
              </div>
            </div>

            {isAdding && (
              <form onSubmit={handleCreate} className="bg-ivory border border-taupe/40 p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" placeholder="Nombre (Ej. Familia González)" value={newInv.name} onChange={(e) => setNewInv({...newInv, name: e.target.value})} required className="flex-1 border border-taupe/40 bg-transparent px-4 py-2 font-sans text-sm" />
                  <input type="number" placeholder="Cupo Máximo" min="1" value={newInv.maxGuests} onChange={(e) => setNewInv({...newInv, maxGuests: Number(e.target.value)})} required className="w-full md:w-32 border border-taupe/40 bg-transparent px-4 py-2 font-sans text-sm" />
                </div>
                <input type="text" placeholder="Saludo (Opcional, Ej. Nos encantará celebrar con ustedes)" value={newInv.greeting} onChange={(e) => setNewInv({...newInv, greeting: e.target.value})} className="w-full border border-taupe/40 bg-transparent px-4 py-2 font-sans text-sm" />
                <div className="flex gap-4">
                  <button type="submit" className="bg-espresso text-ivory px-6 py-2 uppercase tracking-widest text-xs">Guardar</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="border border-espresso/30 text-espresso px-6 py-2 uppercase tracking-widest text-xs">Cancelar</button>
                </div>
              </form>
            )}

            {/* Table placeholder */}
            <div className="bg-ivory border border-taupe/20 p-6 overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-taupe/20 text-taupe uppercase tracking-widest text-xs">
                    <th className="py-3 px-4 font-normal">Familia / Grupo</th>
                    <th className="py-3 px-4 font-normal">Teléfono</th>
                    <th className="py-3 px-4 font-normal">Cupo</th>
                    <th className="py-3 px-4 font-normal">Estado</th>
                    <th className="py-3 px-4 font-normal">Enlace Privado</th>
                  </tr>
                </thead>
                <tbody>
                  {initialInvitations.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-taupe/10">
                      <td className="py-3 px-4 text-espresso font-medium">{inv.name}</td>
                      <td className="py-3 px-4 text-espresso/70">{inv.phone || '-'}</td>
                      <td className="py-3 px-4 text-espresso/70">{inv.maxGuests}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs uppercase tracking-widest ${
                          inv.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'declined' ? 'bg-red-100 text-red-800' : 
                          'bg-sand/50 text-espresso/70'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-taupe hover:text-espresso underline">
                        <a href={`/i/${inv.token}`} target="_blank" rel="noreferrer">Ver Enlace</a>
                      </td>
                    </tr>
                  ))}
                  {initialInvitations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-espresso/50 italic">
                        No hay invitados registrados todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "photos" && (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl text-espresso">Biblioteca de Fotografías</h2>
            <p className="font-sans text-sm text-espresso/70">Sube aquí las fotografías para la invitación.</p>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
                const usageSelect = form.querySelector('select[name="usage"]') as HTMLSelectElement;
                const file = fileInput.files?.[0];
                const usage = usageSelect.value;
                if (!file || usage === "none") { alert("Selecciona archivo y uso."); return; }
                
                try {
                  const { upload } = await import("@vercel/blob/client");
                  const { registerMedia } = await import("@/app/actions/media");
                  
                  const blob = await upload(file.name, file, { 
                    access: 'public', 
                    handleUploadUrl: '/api/upload'
                  });
                  
                  await registerMedia({ url: blob.url, usage });
                  alert("¡Foto subida con éxito!");
                  form.reset();
                } catch(err) {
                  alert("Error al subir la foto");
                  console.error(err);
                }
              }} 
              className="bg-ivory border border-dashed border-taupe/40 p-12 text-center text-taupe space-y-4"
            >
              <input type="file" name="file" accept="image/*" required className="mx-auto block" />
              <select name="usage" className="border border-taupe/40 bg-transparent px-4 py-2 font-sans text-sm text-espresso outline-none">
                <option value="none">Seleccionar uso...</option>
                <option value="cover_both">Portada (Ambas)</option>
                <option value="portrait_kelly">Retrato Kelly</option>
                <option value="portrait_kyara">Retrato Kyara</option>
                <option value="gallery">Galería General</option>
              </select>
              <button type="submit" className="bg-espresso text-ivory px-6 py-2 uppercase tracking-widest text-xs mt-4 block mx-auto">
                Subir Fotografía
              </button>
            </form>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl text-espresso">Configuración</h2>
            <p className="font-sans text-sm text-espresso/70">Ajusta los lugares, horas y demás configuraciones.</p>
          </div>
        )}
      </main>
    </div>
  );
};
