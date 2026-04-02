"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, UserPlus, MessageCircle, MapPin, Briefcase, Globe, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const ALUMNI = [
  { id: 1, name: 'Aditya Menon',   batch: '2021', role: 'SWE @ Google',           location: 'Hyderabad', domain: 'Engineering',  connected: false, avatar: '' },
  { id: 2, name: 'Kavya Reddy',    batch: '2020', role: 'Data Scientist @ Amazon', location: 'Bangalore', domain: 'Data Science', connected: true,  avatar: '' },
  { id: 3, name: 'Ravi Sharma',    batch: '2022', role: 'PM @ Microsoft',          location: 'Pune',      domain: 'Product',      connected: false, avatar: '' },
  { id: 4, name: 'Priti Joshi',    batch: '2019', role: 'Research Lead @ IBM',     location: 'Chennai',   domain: 'Research',     connected: true,  avatar: '' },
  { id: 5, name: 'Arjun Nair',     batch: '2023', role: 'SDE @ Flipkart',          location: 'Noida',     domain: 'Engineering',  connected: false, avatar: '' },
  { id: 6, name: 'Meera Pillai',   batch: '2020', role: 'UX Designer @ Adobe',     location: 'Remote',    domain: 'Design',       connected: false, avatar: '' },
];

const DOMAIN_FILTERS = ['All', 'Engineering', 'Data Science', 'Product', 'Research', 'Design'];

export default function AlumniNetworkPage() {
  const [search, setSearch]         = useState('');
  const [domainFilter, setDomain]   = useState('All');
  const [connections, setConnections] = useState<Record<number, boolean>>(
    Object.fromEntries(ALUMNI.map((a) => [a.id, a.connected]))
  );

  const toggleConnect = (id: number) =>
    setConnections((prev) => ({ ...prev, [id]: !prev[id] }));

  const filtered = ALUMNI.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === 'All' || a.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  const connectedCount = Object.values(connections).filter(Boolean).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Alumni <span className="gradient-text">Network</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Connect and collaborate with fellow Lumina alumni</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Network className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">{connectedCount} connections</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search alumni…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 w-52"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {DOMAIN_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                domainFilter === d
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Network Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display">
            No alumni found.
          </div>
        ) : (
          filtered.map((alumni) => (
            <GlassCard key={alumni.id} className="p-6 hover:border-amber-500/20 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                  <img
                    src={alumni.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.name)}&background=random`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{alumni.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Batch of {alumni.batch}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Briefcase className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  {alumni.role}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                  {alumni.location}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleConnect(alumni.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
                    connections[alumni.id]
                      ? 'bg-green-500/15 border border-green-500/20 text-green-400 hover:bg-green-500/25'
                      : 'bg-amber-500/15 border border-amber-500/20 text-amber-400 hover:bg-amber-500/25',
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {connections[alumni.id] ? 'Connected' : 'Connect'}
                </button>
                <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
