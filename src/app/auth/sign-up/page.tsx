import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthShell, Card, PageLoading } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Create account · HeronKaban" };

const STEPS = ["Continue with your UMak Google account", "Tell us your name and college", "Read and accept the terms", "Join or create your org"];

async function SignUpBody() {
  const viewer = await getViewer();

  if (viewer?.profile.profileCompletedAt) redirect("/auth/continue");

  if (viewer) {
    return (
      <>
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-blue-700">Step 2 of 4</p>
          <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
        </div>
        <Card>
          <ProfileForm email={viewer.email} defaultName={viewer.profile.fullName ?? ""} />
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-gray-600">For University of Makati students only.</p>
      </div>
      <Card className="space-y-5">
        <ol className="space-y-2 text-sm text-gray-700">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <GoogleButton label="Sign up with UMak Google" />
        <p className="text-xs text-gray-500">
          Your UMak Google account proves you&apos;re a UMak student. No password is created or stored by HeronKaban.
        </p>
      </Card>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense fallback={<PageLoading />}>
        <SignUpBody />
      </Suspense>
    </AuthShell>
  );
}
