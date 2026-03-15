"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  Globe,
  Camera,
  LogOut,
  ChevronRight,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <header className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative group">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-display font-bold shadow-xl shadow-blue-500/20 ring-4 ring-white/5 transition-all group-hover:scale-105">
            HA
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-[#09090b] shadow-lg shadow-emerald-500/20" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Hari Kiran</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Principal Admin</span>
            <div className="h-1 w-1 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500">hari@lumina-ai.edu</span>
          </div>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Security Settings */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security & Access
          </h2>
          <div className="glass-v2 border-white/5 divide-y divide-white/5">
            <ProfileOption icon={Key} label="Password Management" sub="Last changed 42 days ago" />
            <ProfileOption icon={Smartphone} label="Two-Factor Auth" sub="Enabled (Authenticator)" isVerified />
            <ProfileOption icon={Fingerprint} label="Passkeys / Biometrics" sub="Registered: MacBook Pro" />
          </div>
        </div>

        {/* Global Preferences */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Platform Preferences
          </h2>
          <div className="glass-v2 border-white/5 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Administrative Shadow Mode</p>
                <p className="text-[10px] text-gray-500">Allow role-switching previews</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-blue-600 relative cursor-pointer">
                <div className="h-3 w-3 rounded-full bg-white absolute top-1 right-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">System-Wide Dark Mode</p>
                <p className="text-[10px] text-gray-500">Force OLED black palette</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-blue-600 relative cursor-pointer">
                <div className="h-3 w-3 rounded-full bg-white absolute top-1 right-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Session ID: adm_77x9_lumina_prod</p>
        <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-600 group hover:text-white transition-all">
          <LogOut className="h-4 w-4" />
          Terminate All Sessions
        </button>
      </div>
    </div>
  );
}

function ProfileOption({ icon: Icon, label, sub, isVerified }: any) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-blue-400 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">{label}</p>
            {isVerified && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
          </div>
          <p className="text-[10px] text-gray-500">{sub}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-blue-400 transition-colors" />
    </div>
  );
}
