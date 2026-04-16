import StandardDashboard from "@/components/dashboard/StandardDashboard";
import { Role } from "@/lib/rbac/roles";

export default function MentorDashboard() {
  return (
    <StandardDashboard role={Role.MENTOR}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Assigned Mentees</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-slate-500 mt-2">Active student connections</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Industry Insight Shares</h3>
          <p className="text-3xl font-bold text-teal-600">8</p>
          <p className="text-sm text-slate-500 mt-2">Resources shared this month</p>
        </div>
      </div>
    </StandardDashboard>
  );
}
