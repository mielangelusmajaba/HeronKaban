import Link from "next/link";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthShell, Card, Notice } from "@/components/ui";

export const metadata = { title: "Sign in · HeronKaban" };

const ERRORS: Record<string, string> = {
  domain: "Only University of Makati Google accounts (@umak.edu.ph) can use HeronKaban. Please switch to your UMak account.",
  oauth: "Google sign-in didn't finish. Please try again.",
};

async function SignInBody({ searchParams }: PageProps<"/auth/sign-in">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="space-y-4">
      {error && <Notice tone="red">{ERRORS[error] ?? ERRORS.oauth}</Notice>}
      <GoogleButton label="Sign in with UMak Google" next={next} />
    </div>
  );
}

export default function SignInPage(props: PageProps<"/auth/sign-in">) {
  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-gray-600">Sign in with your UMak Google account.</p>
      </div>
      <Card className="space-y-4">
        <Suspense fallback={<GoogleButton label="Sign in with UMak Google" />}>
          <SignInBody {...props} />
        </Suspense>
        <p className="text-xs text-gray-500">
          We use Google to confirm you&apos;re a current UMak student. HeronKaban never sees or stores your password.
        </p>
      </Card>
      <p className="mt-6 text-center text-sm text-gray-600">
        New here?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-blue-700 hover:underline">
          Create your account
        </Link>
      </p>
    </AuthShell>
  );
}
