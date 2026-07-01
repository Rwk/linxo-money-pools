import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

type SignOutButtonProps = {
  redirectTo?: string;
};

export function SignOutButton({
  redirectTo = "/"
}: SignOutButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({
          redirectTo
        });
      }}
    >
      <Button type="submit" variant="secondary">
        {t("common.signOut")}
      </Button>
    </form>
  );
}
