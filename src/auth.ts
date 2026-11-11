import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { prisma } from "@/infrastructure/db/prisma";
import {
  authorizeDevelopmentUser,
  isDevelopmentAuthEnabled
} from "@/auth/development-auth";

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

const hasDevelopmentAuth = isDevelopmentAuthEnabled();
const providers: NextAuthConfig["providers"] = hasGoogleOAuthCredentials
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET
      })
    ]
  : [];

if (hasDevelopmentAuth) {
  providers.push(
    Credentials({
      id: "development",
      name: "Development",
      credentials: {},
      authorize: authorizeDevelopmentUser
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    // Auth.js Credentials requires JWT sessions. Production keeps database sessions.
    strategy: hasDevelopmentAuth ? "jwt" : "database"
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.email = user.email ?? null;
        session.user.name = user.name ?? null;
      } else if (session.user && hasDevelopmentAuth) {
        session.user.id = token?.sub ?? "";
        session.user.email = token?.email ?? "";
        session.user.name = token?.name ?? null;
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

export { hasGoogleOAuthCredentials, hasDevelopmentAuth };
