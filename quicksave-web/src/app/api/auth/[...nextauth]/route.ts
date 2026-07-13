import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },

async authorize(credentials) {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/v1/admin/login", {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials?.email,
        password: credentials?.password
      })
    });

    const response = await res.json();

    if (res.ok && response.data?.user) {
      // Logic is now safe because the backend already filtered for Admin/SuperAdmin roles
      return {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
        accessToken: response.data.tokens.accessToken 
      };
    }
    
    throw new Error(response.message || "Invalid Admin Access");
  } catch (e: any) {
    throw new Error(e.message);
  }
}
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/login', // We will build this custom page next!
  },
  session: { strategy: "jwt" }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };