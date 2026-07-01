import Link from "next/link";

import { auth } from "@/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { poolThemes } from "@/config/pool-themes";
import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { t } from "@/i18n/t";

export default async function HomePage() {
  const session = await auth();
  const featuredThemes = [
    poolThemes.BIRTHDAY,
    poolThemes.WEDDING,
    poolThemes.FAREWELL
  ];
  const isSignedIn = isLinxoEmail(session?.user?.email);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              {t("common.internalMvp")}
            </span>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("home.title")}
            </h1>
            <p className="max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              {t("home.body")}
            </p>
            <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
              {t("home.disclaimer")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isSignedIn ? (
              <>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
                  href="/dashboard"
                >
                  {t("common.openDashboard")}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <SignInButton />
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/70 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
                  href="/sign-in"
                >
                  {t("home.signInToManagePools")}
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {featuredThemes.map((theme) => (
              <span
                key={theme.label}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${theme.cardClassName} ${theme.accentClassName}`}
              >
                <span aria-hidden="true">{theme.emoji}</span>
                {theme.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
