import Link from "next/link";

import { hasGoogleOAuthCredentials, hasDevelopmentAuth } from "@/auth";
import { Surface } from "@/components/ui/surface";
import { buttonClassName } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { t } from "@/i18n/t";

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

function getErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "AccessDenied":
      return t("auth.accessDenied");
    case "Configuration":
      return t("auth.configuration");
    case "Verification":
      return t("auth.verification");
    default:
      return error ? t("auth.genericError") : null;
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <Surface className="w-full max-w-lg">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              {t("common.employeeAccess")}
            </span>
            <h1 className="ui-page-title">{t("auth.title")}</h1>
            <p className="text-base leading-7 text-[var(--muted)]">
              {t("auth.body")}
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {!hasGoogleOAuthCredentials && !hasDevelopmentAuth ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("auth.credentialsMissing")}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {hasDevelopmentAuth ? (
              <SignInButton
                provider="development"
                label={t("common.signInDevelopment")}
                redirectTo={callbackUrl || "/dashboard"}
              />
            ) : null}
            {hasGoogleOAuthCredentials || !hasDevelopmentAuth ? (
              <SignInButton
                provider="google"
                disabled={!hasGoogleOAuthCredentials}
                label={t("common.signInWithGoogle")}
                redirectTo={callbackUrl || "/dashboard"}
              />
            ) : null}
            <Link className={buttonClassName("tertiary")} href="/">
              {t("common.backToHome")}
            </Link>
          </div>
        </div>
      </Surface>
    </main>
  );
}
