export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting header skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-9 w-72" />
        <div className="skeleton h-4 w-48" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl border border-white/5" />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-64 w-full rounded-2xl border border-white/5" />
          <div className="skeleton h-40 w-full rounded-2xl border border-white/5" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-48 w-full rounded-2xl border border-white/5" />
          <div className="skeleton h-32 w-full rounded-2xl border border-white/5" />
          <div className="skeleton h-24 w-full rounded-2xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}
