import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { prisma } from "@/infrastructure/db/prisma";

type GoogleProfile = {
  email?: unknown;
  given_name?: unknown;
  family_name?: unknown;
};

function readOptionalProfileString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

const hasGoogleOAuthCredentials =
  Boolean(process.env.AUTH_GOOGLE_ID) &&
  Boolean(process.env.AUTH_GOOGLE_SECRET);

const providers = hasGoogleOAuthCredentials
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET
      })
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  pages: {
    signIn: "/sign-in"
  },
  providers,
  callbacks: {
    async signIn({ profile, user }) {
      const email =
        typeof profile?.email === "string" ? profile.email : user.email;

      return isLinxoEmail(email);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.email = user.email ?? null;
        session.user.name = user.name ?? null;
      }

      return session;
    }
  },
  events: {
    async signIn({ user, profile }) {
      if (!user.id || !profile) {
        return;
      }

      const googleProfile = profile as GoogleProfile;
      const firstName = readOptionalProfileString(googleProfile.given_name);
      const lastName = readOptionalProfileString(googleProfile.family_name);

      if (firstName === null && lastName === null) {
        return;
      }

      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          firstName,
          lastName
        }
      });
    }
  }
});

export { hasGoogleOAuthCredentials };
