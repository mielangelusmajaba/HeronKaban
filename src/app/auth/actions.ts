"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { CONSENT_VERSION } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean } | undefined;

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  college: z.string().trim().min(2, "Please choose your college.").max(120),
});

/** Sign-up profile step (after Google). */
export async function completeProfile(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");
  const parsed = profileSchema.safeParse({ fullName: form.get("fullName"), college: form.get("college") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await getDb()
    .update(profiles)
    .set({ fullName: parsed.data.fullName, college: parsed.data.college, profileCompletedAt: new Date() })
    .where(eq(profiles.id, viewer.id));
  redirect("/auth/continue");
}

/** Saves consent with its version and timestamp (FR-02). */
export async function acceptConsent(version: string): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");
  if (version !== CONSENT_VERSION) return { error: "The terms changed while you were reading. Please reload the page." };
  await getDb()
    .update(profiles)
    .set({ consentVersion: CONSENT_VERSION, consentAt: new Date() })
    .where(eq(profiles.id, viewer.id));
  redirect("/auth/continue");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
