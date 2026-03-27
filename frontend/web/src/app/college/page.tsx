"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Building2, BookOpen, Users, Settings } from "lucide-react";
import { api } from "@/lib/api";

export default function CollegeDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const userData = await api.getCurrentUser();
      setUser(userData);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">
          College Admin
        </p>
        <h1 className="mt-3 text-4xl font-display font-bold text-white">
          College Control Center
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-gray-400">
          Manage departments, programs, classes, and user onboarding for your institution.
        </p>
        {user && (
          <p className="mt-4 text-sm text-gray-500">
            Signed in as {user.name}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Departments"
          description="Define academic units and HOD assignments."
          icon={<Building2 className="h-5 w-5" />}
          href="/college/departments"
        />
        <DashboardCard
          title="Programs & Classes"
          description="Create programs, semesters, and class limits."
          icon={<BookOpen className="h-5 w-5" />}
          href="/college/classes"
        />
        <DashboardCard
          title="Users"
          description="Invite and manage faculty, HODs, and students."
          icon={<Users className="h-5 w-5" />}
          href="/college/users"
        />
        <DashboardCard
          title="Settings"
          description="College profile and login policies."
          icon={<Settings className="h-5 w-5" />}
          href="/college/settings"
        />
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="glass-v2 border-white/10 p-6 transition-all hover:border-lumina-primary/40 hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3 text-lumina-primary">
        {icon}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-gray-400">{description}</p>
    </Link>
  );
}
