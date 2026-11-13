import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

type SignOutButtonProps = {
  redirectTo?: string;
  identity?: string;
};

export function SignOutButton({
  redirectTo = "/",
  identity
}: SignOutButtonProps) {
  return (
    <form
      aria-label={
        identity ? t("navigation.accountIdentity", { identity }) : undefined
      }
      action={async () => {
        "use server";
        await signOut({
          redirectTo
        });
      }}
    >
      {identity ? (
        <span
          className="nav-account-identity"
          aria-hidden="true"
          title={identity}
        >
          {identity}
        </span>
      ) : null}
      <Button type="submit" variant="tertiary" title={identity}>
        {t("common.signOut")}
      </Button>
    </form>
  );
}
