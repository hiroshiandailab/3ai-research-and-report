import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, isAllowedEmail, signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "このGoogleアカウントには利用権限がありません。",
  Configuration: "ログイン設定が完了していません。",
  OAuthCallbackError: "Googleログインを完了できませんでした。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (isAllowedEmail(session?.user?.email)) redirect("/");

  const { error } = await searchParams;
  const authReady = Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_ALLOWED_EMAILS,
  );

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F8FB] px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-[#D8E2EC] bg-white p-8 shadow-[var(--rw-shadow)]">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
            Private Research Workspace
          </p>
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            3AI Research & Report
          </h1>
          <p className="text-sm leading-relaxed text-[#64748B]">
            許可されたGoogleアカウントでログインしてください。
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {ERROR_MESSAGES[error] ?? "ログイン中にエラーが発生しました。"}
          </p>
        )}

        {!authReady && (
          <p
            role="status"
            className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            管理者によるGoogleログイン設定が必要です。
          </p>
        )}

        <form action={loginWithGoogle} className="mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={!authReady}
            className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
          >
            <LogIn aria-hidden />
            Googleでログイン
          </Button>
        </form>
      </section>
    </main>
  );
}
