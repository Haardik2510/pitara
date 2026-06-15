// app/lib/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const db = supabaseAdmin();
          const { data: existing } = await db
            .from("user_profiles")
            .select("id")
            .eq("email", user.email)
            .single();

          if (!existing) {
            await db.from("user_profiles").insert({
              id: user.id,
              email: user.email,
              name: user.name || "",
              avatar_url: user.image || null,
              is_admin: false,
            });
          }
        } catch (e) {
          console.error("signIn callback error:", e);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const sessionUser = session.user as typeof session.user & {
          id?: string
          isAdmin?: boolean
        }
        sessionUser.id = token.sub;
        try {
          const db = supabaseAdmin();
          const { data } = await db
            .from("user_profiles")
            .select("is_admin")
            .eq("email", session.user.email)
            .single();
          sessionUser.isAdmin = data?.is_admin || false;
        } catch {}
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: { signIn: "/" },
  secret: process.env.NEXTAUTH_SECRET,
});
