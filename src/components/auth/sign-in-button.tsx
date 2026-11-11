import { signIn, hasDevelopmentAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

type SignInButtonProps = {
  disabled?: boolean;
  label: string;
  redirectTo?: string;
  className?: string;
  provider?: "google" | "development";
};

export function SignInButton({
  disabled = false,
  label,
  redirectTo = "/dashboard",
  className,
  provider = hasDevelopmentAuth ? "development" : "google"
}: SignInButtonProps) {
  return (
    <form
      action={async () => {
        "use server";

        if (disabled) {
          return;
        }

        await signIn(provider, {
          redirectTo
        });
      }}
    >
      <Button
        className={`w-full whitespace-nowrap sm:w-auto ${className ?? ""}`}
        disabled={disabled}
        type="submit"
      >
        {provider === "development" ? t("common.signInDevelopment") : label}
      </Button>
    </form>
  );
}
