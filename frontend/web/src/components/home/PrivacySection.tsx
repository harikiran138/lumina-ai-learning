"use client";

import { Lock, EyeOff, ShieldCheck, UserCheck, Database, Key } from "lucide-react";

const privacyFeatures = [
  {
    icon: Lock,
    title: "Minimum Data Access",
    description: "Strictly follows the principle of least privilege. Users only see data required for their specific role."
  },
  {
    icon: EyeOff,
    title: "K-Anonymity Protection",
    description: "Research data is anonymized using k-anonymity protocols to protect individual student identities."
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Permissions",
    description: "Hierarchical access control ensuring teachers, admins, and parents have distinct data boundaries."
  },
  {
    icon: Key,
    title: "Encrypted Counselor Notes",
    description: "Sensitive safeguarding communications are end-to-end encrypted and siloed from the AI engine."
  }
];

export default function PrivacySection() {
  return (
    <section className="py-24 relative overflow-hidden bg-surface-950/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 font-mono text-xs uppercase tracking-widest text-blue-400">
             <ShieldCheck className="h-4 w-4" />
             <span>Privacy-First Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Enterprise-Grade Security & Privacy
          </h2>
          <p className="text-lg text-gray-400">
            Lumina is built with a zero-trust mindset, ensuring student data is protected, anonymized, and strictly governed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="glass-panel p-8 rounded-2xl border border-white/5 flex space-x-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <feature.icon className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
           <div className="inline-block p-1 bg-gradient-to-r from-blue-500/20 via-lumina-primary/20 to-blue-500/20 rounded-2xl">
              <div className="bg-surface-950 rounded-[14px] px-8 py-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 border border-white/5">
                 <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-950 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                        {i === 1 ? "GDPR" : i === 2 ? "FERPA" : i === 3 ? "COPPA" : "ISO"}
                      </div>
                    ))}
                 </div>
                 <p className="text-sm text-gray-300">Compliant with global data protection standards and institutional regulations.</p>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
