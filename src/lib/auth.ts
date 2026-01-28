import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// ✅ Wenn du bcrypt nutzt:
// import bcrypt from "bcryptjs";
// async function verifyPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

// ✅ Minimaler Platzhalter (ERSETZEN durch echte Prüfung!)
async function verifyPassword(pw: string, hash: string) {
  // WICHTIG: Ersetze das durch bcrypt.compare oder deine bestehende Logik.
  // Diese Zeile ist nur ein Dummy, damit der Code komplett ist:
  return pw && hash && pw.length > 0;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, passwordHash: true, role: true, name: true },
        });

        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // ✅ Returned object becomes token base
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name ?? undefined,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On login, copy fields from `authorize` user into token
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Put id/role into session.user so guards work in route handlers/pages
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
