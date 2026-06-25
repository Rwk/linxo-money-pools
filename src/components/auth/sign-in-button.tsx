import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  disabled?: boolean;
  redirectTo?: string;
};

export function SignInButton({
  disabled = false,
  redirectTo = "/dashboard"
}: SignInButtonProps) {
  return (
    <form
      action={async () => {
        "use server";

        if (disabled) {
          return;
        }

        await signIn("google", {
          redirectTo
        });
      }}
    >
      <Button className="w-full sm:w-auto" disabled={disabled} type="submit">
        Sign in with Google
      </Button>
    </form>
  );
}
