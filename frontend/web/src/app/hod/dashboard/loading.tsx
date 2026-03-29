export default function HODDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-60" />
        <div className="skeleton h-4 w-44" />
      </div>

      {/* Department KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl border border-white/5" />
        ))}
      </div>

      {/* Risk + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 w-full rounded-2xl border border-white/5" />
        <div className="space-y-4">
          <div className="skeleton h-28 w-full rounded-2xl border border-white/5" />
          <div className="skeleton h-28 w-full rounded-2xl border border-white/5" />
        </div>
      </div>

      <div className="skeleton h-52 w-full rounded-2xl border border-white/5" />
    </div>
  );
}
