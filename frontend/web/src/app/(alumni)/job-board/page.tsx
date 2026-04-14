"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, Filter, MapPin, Clock, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
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

const JOBS = [
  {
    id: 1, type: 'Full-time', title: 'Software Engineer — Backend',    company: 'Acme Corp',      location: 'Bangalore · Remote',   domain: 'Engineering',    deadline: 'Apr 15, 2025', applications: 12, status: 'active',  postedBy: 'me',
  },
  {
    id: 2, type: 'Internship', title: 'Data Science Intern',            company: 'DataVerse AI',   location: 'Mumbai · Hybrid',       domain: 'Data Science',   deadline: 'Apr 20, 2025', applications: 8,  status: 'active',  postedBy: 'me',
  },
  {
    id: 3, type: 'Full-time', title: 'Product Manager',                 company: 'StartupX',      location: 'Delhi · On-site',       domain: 'Product',        deadline: 'Mar 31, 2025', applications: 5,  status: 'expired', postedBy: 'network',
  },
  {
    id: 4, type: 'Internship', title: 'Frontend Developer Intern',       company: 'PixelCraft',   location: 'Remote',                domain: 'Engineering',    deadline: 'Apr 25, 2025', applications: 3,  status: 'active',  postedBy: 'network',
  },
];

const DOMAIN_FILTERS = ['All', 'Engineering', 'Data Science', 'Product', 'Design', 'Marketing'];
const TYPE_FILTERS   = ['All', 'Full-time', 'Internship', 'Contract'];

export default function JobBoardPage() {
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState('');
  const [domainFilter, setDomain]   = useState('All');
  const [typeFilter, setType]       = useState('All');
  const [formData, setFormData]     = useState({ title: '', company: '', location: '', domain: '', type: 'Full-time', deadline: '', description: '' });
  const [posted, setPosted]         = useState(false);

  const filtered = JOBS.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === 'All' || j.domain === domainFilter;
    const matchType   = typeFilter   === 'All' || j.type   === typeFilter;
    return matchSearch && matchDomain && matchType;
  });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    setPosted(true);
    setTimeout(() => { setShowForm(false); setPosted(false); }, 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Job <span className="gradient-text">Board</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Post opportunities and connect students to the industry</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] w-fit"
        >
          <Plus className="w-4 h-4" /> Post Job / Internship
        </button>
      </div>

      {/* Moderation notice */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-amber-300 text-xs font-bold uppercase tracking-widest">
        <AlertCircle className="w-4 h-4 shrink-0" />
        All postings are reviewed by admin before going live
      </div>

      {/* Post Form */}
      {showForm && (
        <GlassCard className="p-8">
          <h2 className="text-lg font-bold text-white mb-6 lowercase tracking-tighter">New Opportunity</h2>
          {posted ? (
            <div className="py-8 flex flex-col items-center gap-3 text-green-300">
              <CheckCircle className="w-10 h-10" />
              <p className="font-bold text-sm uppercase tracking-widest">Submitted for Review</p>
            </div>
          ) : (
            <form onSubmit={handlePost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'title',    label: 'Job Title',    placeholder: 'e.g. Backend Engineer' },
                { key: 'company',  label: 'Company',      placeholder: 'e.g. Acme Corp' },
                { key: 'location', label: 'Location',     placeholder: 'e.g. Bangalore · Remote' },
                { key: 'deadline', label: 'Apply By',     placeholder: 'YYYY-MM-DD', type: 'date' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={(formData as any)[field.key]}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                >
                  {TYPE_FILTERS.filter((t) => t !== 'All').map((t) => <option key={t} value={t} className="bg-black">{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Domain</label>
                <select
                  value={formData.domain}
                  onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                >
                  <option value="" className="bg-black">Select domain</option>
                  {DOMAIN_FILTERS.filter((d) => d !== 'All').map((d) => <option key={d} value={d} className="bg-black">{d}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Role description, requirements, perks…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 w-48"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {DOMAIN_FILTERS.map((d) => (
            <button key={d} onClick={() => setDomain(d)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all', domainFilter === d ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300')}>
              {d}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all', typeFilter === t ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display">
            No opportunities found.
          </div>
        ) : (
          filtered.map((job) => (
            <GlassCard key={job.id} className={cn('p-6', job.status === 'expired' && 'opacity-50')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border',
                      job.type === 'Internship'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20',
                    )}>
                      {job.type}
                    </span>
                    {job.status === 'expired' && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">Expired</span>
                    )}
                    {job.postedBy === 'me' && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">Your Post</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-400 font-semibold">{job.company}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> Apply by {job.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    {job.applications} applications
                  </span>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[11px] font-bold uppercase tracking-widest hover:border-amber-500/20 hover:text-white transition-all">
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
