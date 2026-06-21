import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedEmail(
  email: string | null | undefined,
): email is string {
  return Boolean(email && allowedEmails().has(email.trim().toLowerCase()));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ account, profile, user }) {
      const email = user.email?.trim().toLowerCase();
      const isVerified =
        !profile ||
        !("email_verified" in profile) ||
        profile.email_verified === true;

      return Boolean(
        account?.provider === "google" &&
          email &&
          isVerified &&
          isAllowedEmail(email),
      );
    },
  },
});
