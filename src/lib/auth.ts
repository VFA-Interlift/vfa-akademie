import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { bremsePruefen, bremseZuruecksetzen } from "@/lib/bremse";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
};

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
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        // Zehn Fehlversuche in fünf Minuten, dann eine Viertelstunde Pause.
        //
        // Der Schlüssel enthält Adresse UND Absender: Zählte er nur die
        // Adresse, könnte jemand ein fremdes Konto durch absichtlich falsche
        // Eingaben aussperren. So bremst er nur den, der es versucht.
        const absender =
          (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
          (req?.headers?.["x-real-ip"] as string | undefined)?.trim() ||
          "unbekannt";

        const bremsSchluessel = `login:${email}:${absender}`;

        const bremse = bremsePruefen(bremsSchluessel, {
          versuche: 10,
          fensterSekunden: 300,
          sperreSekunden: 900,
        });

        if (!bremse.erlaubt) {
          throw new Error("ZU_VIELE_VERSUCHE");
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
            emailVerifiedAt: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordIsValid) {
          return null;
        }

        // Unbestätigte Adressen kommen nicht hinein. Die Prüfung sitzt bewusst
        // NACH dem Passwortvergleich: sonst verriete die Fehlermeldung, welche
        // Adressen registriert sind.
        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NICHT_BESTAETIGT");
        }

        bremseZuruecksetzen(bremsSchluessel);

        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.name ||
          user.email;

        // Zeitpunkt der letzten Anmeldung festhalten (für Admin „zuletzt online").
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const authUser: AuthUser = {
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
        const authUser = user as AuthUser;

        token.id = authUser.id;
        token.email = authUser.email;
        token.role = authUser.role;
        token.name = authUser.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.role =
          token.role === "ADMIN" || token.role === "USER" ? token.role : "USER";
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