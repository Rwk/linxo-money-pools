import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  disabled?: boolean;
  label: string;
  redirectTo?: string;
  className?: string;
};

export function SignInButton({
  disabled = false,
  label,
  redirectTo = "/dashboard",
  className
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
      <Button
        className={`w-full whitespace-nowrap sm:w-auto ${className ?? ""}`}
        disabled={disabled}
        type="submit"
      >
        {label}
      </Button>
    </form>
  );
}
