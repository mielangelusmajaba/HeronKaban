"use client";

import { useActionState } from "react";
import { completeProfile } from "../actions";
import { Button, Field, inputCls, Notice } from "@/components/ui";

export function ProfileForm({ email, defaultName }: { email: string; defaultName: string }) {
  const [state, action, pending] = useActionState(completeProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="UMak email">
        <input className={inputCls} value={email} disabled readOnly />
      </Field>
      <Field label="Full name" hint="Shown to the members and officers of orgs you join. Never put on the blockchain.">
        <input name="fullName" className={inputCls} defaultValue={defaultName} required minLength={2} autoComplete="name" />
      </Field>
      <Field label="College / institute">
        <input
          name="college"
          className={inputCls}
          required
          minLength={2}
          placeholder="e.g. College of Computing and Information Sciences"
        />
      </Field>
      {state?.error && <Notice tone="red">{state.error}</Notice>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
