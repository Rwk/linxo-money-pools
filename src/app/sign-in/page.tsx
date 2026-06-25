import Link from "next/link";

import { hasGoogleOAuthCredentials } from "@/auth";
import { SignInButton } from "@/components/auth/sign-in-button";

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

function getErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "AccessDenied":
      return "You must sign in with a valid @linxo.com Google account.";
    case "Configuration":
      return "Google sign-in is not configured yet for this environment.";
    case "Verification":
      return "Your sign-in request could not be verified. Please try again.";
    default:
      return error ? "Sign-in failed. Please try again." : null;
  }
}

export default async function SignInPage({
  searchParams
}: SignInPageProps) {
  const { callbackUrl, error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              Employee access
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Sign in with your Linxo Google account
            </h1>
            <p className="text-base leading-7 text-[var(--muted)]">
              Only Linxo employees can create and manage money pools. Use your
              @linxo.com Google account to continue.
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {!hasGoogleOAuthCredentials ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Google OAuth credentials are missing. Add placeholder values in
              your local environment before testing sign-in.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <SignInButton
              disabled={!hasGoogleOAuthCredentials}
              redirectTo={callbackUrl || "/dashboard"}
            />
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/70 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
              href="/"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
