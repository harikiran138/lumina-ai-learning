"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Star, Flame, Search, Filter, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { api, getConfiguredApiBase } from "@/lib/api";

type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  level: number;
  trend: "up" | "down" | "stable";
  isCurrentUser: boolean;
};

export default function StudentLeaderboard() {
  const [activeTab, setActiveTab] = useState<"global" | "class">("global");
  const [activeTimeframe, setActiveTimeframe] = useState<"weekly" | "all-time">("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const apiBase = getConfiguredApiBase();
        if (!apiBase) {
          setLeaderboard([]);
          return;
        }
        const res = await fetch(
          `${apiBase}/api/student/leaderboard?timeframe=${activeTimeframe}`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          const entries: LeaderboardEntry[] = (data.entries || []).map((e: any) => ({
            rank: e.rank,
            id: e.userId,
            name: e.name,
            avatar: e.avatar,
            xp: e.xp,
            streak: e.streak,
            // Derive level from XP: 1 level per 500 XP
            level: Math.max(1, Math.floor(e.xp / 500)),
            // Trend not tracked yet — default stable
            trend: "stable" as const,
            isCurrentUser: e.isCurrentUser,
          }));
          setLeaderboard(entries);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab, activeTimeframe]);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Leaderboard</h1>
          <p className="text-gray-400">Compete with learners worldwide and climb the ranks.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab("global")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "global" ? "bg-lumina-primary text-black" : "text-gray-400 hover:text-white"}`}
          >
            Global
          </button>
          <button 
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "class" ? "bg-lumina-primary text-black" : "text-gray-400 hover:text-white"}`}
          >
            My Class
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <PodiumCard entry={leaderboard[1]} rank={2} silver />
        <PodiumCard entry={leaderboard[0]} rank={1} gold />
        <PodiumCard entry={leaderboard[2]} rank={3} bronze />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search learners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTimeframe("weekly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${activeTimeframe === "weekly" ? "text-lumina-primary bg-lumina-primary/10" : "text-gray-500 hover:text-gray-300"}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setActiveTimeframe("all-time")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${activeTimeframe === "all-time" ? "text-lumina-primary bg-lumina-primary/10" : "text-gray-500 hover:text-gray-300"}`}
            >
              All Time
            </button>
          </div>
          <button className="p-2 bg-white/5 rounded-lg border border-white/10 text-gray-400 hover:text-white">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Learner</th>
                <th className="px-6 py-4 font-semibold text-center">Level</th>
                <th className="px-6 py-4 font-semibold text-center">Streak</th>
                <th className="px-6 py-4 font-semibold text-right">Experience (XP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.map((entry) => (
                <tr 
                  key={entry.id} 
                  className={`group transition-colors ${entry.isCurrentUser ? "bg-lumina-primary/5" : "hover:bg-white/[0.02]"}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 font-bold ${entry.rank <= 3 ? "text-lumina-primary" : "text-gray-400"}`}>
                        #{entry.rank}
                      </span>
                      <TrendIndicator trend={entry.trend} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full border border-white/10" />
                      <div>
                        <p className={`font-semibold ${entry.isCurrentUser ? "text-lumina-primary" : "text-white"}`}>
                          {entry.name}
                        </p>
                        {entry.isCurrentUser && <span className="text-[10px] bg-lumina-primary/20 text-lumina-primary px-1.5 py-0.5 rounded uppercase font-bold">You</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-300 font-medium">{entry.level}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Flame className={`w-4 h-4 ${entry.streak > 10 ? "text-amber-500" : "text-gray-500"}`} />
                      <span className="text-white font-semibold">{entry.streak}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-bold">{entry.xp.toLocaleString()} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ entry, rank, gold, silver, bronze }: { entry?: LeaderboardEntry, rank: number, gold?: boolean, silver?: boolean, bronze?: boolean }) {
  if (!entry) return null;
  
  return (
    <div className={`relative flex flex-col items-center p-6 rounded-3xl border transition-all hover:scale-105 ${
      gold 
        ? "bg-gradient-to-b from-amber-500/20 to-transparent border-amber-500/30 md:pb-12 h-64 shadow-[0_20px_50px_rgba(245,158,11,0.1)]" 
        : silver
          ? "bg-white/5 border-white/10 h-56"
          : "bg-white/5 border-white/10 h-52"
    }`}>
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          rank === 1 ? "bg-amber-500 border-amber-300 text-black" : "bg-gray-800 border-gray-600 text-white"
        }`}>
          <span className="text-xs font-bold">{rank}</span>
        </div>
      </div>
      
      <div className="relative mb-4">
        <img src={entry.avatar} alt={entry.name} className={`rounded-full border-2 ${
          gold ? "w-24 h-24 border-amber-500" : silver ? "w-20 h-20 border-gray-400" : "w-16 h-16 border-amber-700"
        }`} />
        {gold && <Trophy className="absolute -right-2 -bottom-2 w-8 h-8 text-amber-500 drop-shadow-lg" />}
      </div>
      
      <h3 className="font-bold text-white text-lg text-center leading-tight mb-1">{entry.name}</h3>
      <p className="text-lumina-primary font-bold text-sm mb-3">{entry.xp.toLocaleString()} XP</p>
      
      <div className="flex gap-4">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Level</p>
          <p className="text-white font-bold text-sm">{entry.level}</p>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Streak</p>
          <p className="text-white font-bold text-sm">{entry.streak}d</p>
        </div>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: LeaderboardEntry["trend"] }) {
  if (trend === "up") return <ArrowUp className="w-3 h-3 text-yellow-500" />;
  if (trend === "down") return <ArrowDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-600" />;
}
