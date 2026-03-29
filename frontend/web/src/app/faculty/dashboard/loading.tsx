export default function FacultyDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-4 w-44" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl border border-white/5" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-72 w-full rounded-2xl border border-white/5" />
        <div className="skeleton h-72 w-full rounded-2xl border border-white/5" />
      </div>

      <div className="skeleton h-48 w-full rounded-2xl border border-white/5" />
    </div>
  );
}
