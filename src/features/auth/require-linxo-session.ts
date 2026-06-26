import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isLinxoEmail } from "@/auth/linxo-email-domain";

export type LinxoSessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireLinxoSession(): Promise<LinxoSessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email || !isLinxoEmail(user.email)) {
    redirect("/sign-in?error=AccessDenied");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null
  };
}
