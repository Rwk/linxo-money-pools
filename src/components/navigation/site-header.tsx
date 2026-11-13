import { auth } from "@/auth";
import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteNavigation } from "@/components/navigation/site-navigation";

export async function SiteHeader() {
  const session = await auth();
  const signedIn = Boolean(
    session?.user?.id && isLinxoEmail(session.user.email)
  );
  return (
    <SiteNavigation
      signedIn={signedIn}
      accountAction={signedIn ? <SignOutButton /> : null}
    />
  );
}
