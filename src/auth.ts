import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordIsValid) {
          return null;
        }

        const authUser: User = {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };

        return authUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
        session.user.role = token.role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};