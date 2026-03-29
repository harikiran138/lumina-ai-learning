export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-4 w-40" />
      </div>

      {/* System overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl border border-white/5" />
        ))}
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 w-full rounded-2xl border border-white/5" />
        <div className="space-y-4">
          <div className="skeleton h-36 w-full rounded-2xl border border-white/5" />
          <div className="skeleton h-36 w-full rounded-2xl border border-white/5" />
        </div>
      </div>

      <div className="skeleton h-40 w-full rounded-2xl border border-white/5" />
    </div>
  );
}
