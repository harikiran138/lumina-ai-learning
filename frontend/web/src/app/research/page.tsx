import Link from "next/link";

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Lumina Research
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Research and platform validation work.</h1>
          <p className="max-w-2xl text-base leading-7 text-text-secondary">
            Lumina combines teacher-verified AI, learning analytics, and onboarding flows into one education platform.
            This page exists so the Research links in the product resolve cleanly in production.
          </p>
        </div>
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-surface-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground">Current tracks</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              AI answer verification, role-aware onboarding, academic analytics, and reliability hardening across auth
              and course workflows.
            </p>
          </article>
          <article className="rounded-3xl border border-border bg-surface-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground">Need access?</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Sign in to explore the role-based dashboards, or create an account to start onboarding.
            </p>
          </article>
        </section>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Go to Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-surface"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
