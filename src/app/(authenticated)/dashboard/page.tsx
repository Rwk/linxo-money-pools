import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user?.id || !isLinxoEmail(email)) {
    redirect("/sign-in?error=AccessDenied");
  }

  const displayName = session.user.name ?? email;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-2xl rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
                Dashboard
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Welcome, {displayName}
                </h1>
                <p className="text-sm text-[var(--muted)]">{email}</p>
              </div>
            </div>
            <SignOutButton />
          </div>

          <div className="rounded-[1.5rem] border border-[var(--surface-border)] bg-white/70 p-5">
            <p className="text-base leading-7 text-slate-900">
              Your money pools will appear here.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
