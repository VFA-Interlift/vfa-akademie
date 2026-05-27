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
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

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
            role: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(user.passwordHash, password);

        if (!passwordIsValid) {
          return null;
        }

        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.name ||
          user.email;

        const authUser: User = {
          id: user.id,
          email: user.email.trim().toLowerCase(),
          role: user.role,
          name: displayName,
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
        token.role = user.role;
        token.name = user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.role = token.role;
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};