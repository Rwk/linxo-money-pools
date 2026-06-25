import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

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
        Sign out
      </Button>
    </form>
  );
}
