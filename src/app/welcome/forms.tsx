"use client";

import { useActionState, useTransition } from "react";
import { createOrg, joinWithCode, requestToJoin, withdrawRequest } from "@/lib/orgs/actions";
import { Button, Field, inputCls, Notice } from "@/components/ui";

export function JoinCodeForm() {
  const [state, action, pending] = useActionState(joinWithCode, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="join-code">
          Join code
        </label>
        <input
          id="join-code"
          name="code"
          className={`${inputCls} font-mono tracking-widest uppercase`}
          placeholder="e.g. 7KQ2MZ4P"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={12}
          required
        />
        <Button type="submit" disabled={pending} className="sm:w-40">
          {pending ? "Joining…" : "Join"}
        </Button>
      </div>
      {state?.error && <Notice tone="red">{state.error}</Notice>}
    </form>
  );
}

export function RequestJoinForm({ orgId, officerSeat = false }: { orgId: string; officerSeat?: boolean }) {
  const [state, action, pending] = useActionState(requestToJoin, undefined);
  if (state?.ok) return <Notice tone="green">{state.ok}</Notice>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      {officerSeat ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Seat">
            <select name="requestedRole" className={inputCls} defaultValue="officer">
              <option value="officer">Officer (exec board)</option>
              <option value="committee">Committee (exec comms)</option>
            </select>
          </Field>
          <Field label="Position title">
            <input name="positionTitle" className={inputCls} placeholder="e.g. Treasurer" maxLength={60} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note to the President (optional)">
              <input name="note" className={inputCls} maxLength={300} placeholder="e.g. Elected Treasurer for AY 2026-2027" />
            </Field>
          </div>
        </div>
      ) : (
        <input type="hidden" name="requestedRole" value="member" />
      )}
      {state?.error && <Notice tone="red">{state.error}</Notice>}
      <Button type="submit" variant={officerSeat ? "primary" : "secondary"} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : officerSeat ? "Ask the President" : "Request to join"}
      </Button>
    </form>
  );
}

export function WithdrawButton({ membershipId }: { membershipId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" disabled={pending} onClick={() => start(() => withdrawRequest(membershipId))} className="!min-h-9 text-xs">
      {pending ? "…" : "Withdraw"}
    </Button>
  );
}

export function CreateOrgForm({ defaultCollege }: { defaultCollege?: string | null }) {
  const [state, action, pending] = useActionState(createOrg, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Organization name">
        <input name="name" className={inputCls} required minLength={3} maxLength={100} placeholder="e.g. Computer Science Society" />
      </Field>
      <Field label="Short description (optional)">
        <textarea name="description" className={`${inputCls} min-h-20`} maxLength={500} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="College / institute">
          <input name="college" className={inputCls} defaultValue={defaultCollege ?? ""} maxLength={120} />
        </Field>
        <Field label="Your position" hint="You'll be the org's President in HeronKaban.">
          <input name="positionTitle" className={inputCls} defaultValue="President" maxLength={60} />
        </Field>
      </div>
      <Notice tone="amber">
        New orgs show as <strong>Unverified</strong> until a HeronKaban admin checks them. Everything still works while
        unverified, and members will see the badge.
      </Notice>
      {state?.error && <Notice tone="red">{state.error}</Notice>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
