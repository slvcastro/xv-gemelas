"use client";

import { useState } from "react";
import { loginAdmin } from "@/app/actions/adminAuth";

export const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginAdmin(password);
    if (!res.success) {
      setError(res.error || "Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand/10 px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-ivory p-8 border border-taupe/20 space-y-6 text-center">
        <h1 className="font-serif text-2xl text-espresso">Panel de Control</h1>
        <p className="font-sans text-xs uppercase tracking-widest text-taupe">Acceso Restringido</p>
        
        {error && <p className="text-red-500 text-xs font-sans">{error}</p>}
        
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border-b border-espresso/30 focus:border-espresso outline-none py-2 font-sans text-center text-espresso transition-colors rounded-none"
        />
        
        <button 
          type="submit"
          className="w-full bg-espresso text-ivory py-3 uppercase tracking-widest text-xs hover:bg-espresso/90 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};
