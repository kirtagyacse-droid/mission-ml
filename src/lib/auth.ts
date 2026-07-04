import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAIL;
      if (!allowed) {
        console.error("ALLOWED_EMAIL env var not set");
        return false;
      }
      if (profile?.email !== allowed) {
        console.warn(`Sign-in rejected for: ${profile?.email}`);
        return false;
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        let user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
            },
          });
        }
        (session as any).userId = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
