"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button, Field, inputCls, Notice } from "@/components/ui";
import {
  decideMembership,
  regenerateJoinCode,
  removeMember,
  setOrgVerified,
  setPresidentSigner,
  updateMemberRole,
  updateOrgSettings,
} from "@/lib/orgs/actions";

type Msg = { error?: string; ok?: string } | undefined;

function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return msg.error ? <Notice tone="red">{msg.error}</Notice> : msg.ok ? <Notice tone="green">{msg.ok}</Notice> : null;
}

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Msg>();
  const go = (fn: () => Promise<Msg>) =>
    start(async () => {
      setMsg(await fn());
      router.refresh();
    });
  return { pending, msg, go };
}

export function DecideButtons({ membershipId }: { membershipId: string }) {
  const { pending, msg, go } = useAction();
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button className="!min-h-9 text-xs" disabled={pending} onClick={() => go(() => decideMembership(membershipId, true))}>
          Approve
        </Button>
        <Button variant="secondary" className="!min-h-9 text-xs" disabled={pending} onClick={() => go(() => decideMembership(membershipId, false))}>
          Decline
        </Button>
      </div>
      {msg?.error && <Notice tone="red">{msg.error}</Notice>}
    </div>
  );
}

export function RemoveButton({ membershipId, label = "Remove" }: { membershipId: string; label?: string }) {
  const { pending, msg, go } = useAction();
  return (
    <>
      <Button
        variant="ghost"
        className="!min-h-9 text-xs text-red-700"
        disabled={pending}
        onClick={() => {
          if (confirm("Remove this person from the org?")) go(() => removeMember(membershipId));
        }}
      >
        {label}
      </Button>
      {msg?.error && <Notice tone="red">{msg.error}</Notice>}
    </>
  );
}

export function ResetCodeButton({ orgId }: { orgId: string }) {
  const { pending, msg, go } = useAction();
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (confirm("Make a new join code? The old one stops working.")) go(() => regenerateJoinCode(orgId));
        }}
      >
        Generate new code
      </Button>
      <Status msg={msg} />
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Copied" : "Copy"}
    </Button>
  );
}

export function RoleForm({
  membershipId,
  role,
  positionTitle,
  isSigner,
  hasWallet,
}: {
  membershipId: string;
  role: "officer" | "committee" | "member";
  positionTitle: string | null;
  isSigner: boolean;
  hasWallet: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: Msg, form: FormData) => {
    const res = await updateMemberRole(prev, form);
    router.refresh();
    return res;
  }, undefined);
  const [r, setR] = useState(role);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <input type="hidden" name="membershipId" value={membershipId} />
      <Field label="Role">
        <select name="role" className={inputCls} value={r} onChange={(e) => setR(e.target.value as typeof role)}>
          <option value="officer">Officer</option>
          <option value="committee">Committee</option>
          <option value="member">Member</option>
        </select>
      </Field>
      <Field label="Title">
        <input name="positionTitle" className={inputCls} defaultValue={positionTitle ?? ""} maxLength={60} />
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-sm" title={hasWallet ? "" : "They need to link a wallet first"}>
        <input type="checkbox" name="isSigner" defaultChecked={isSigner} disabled={r !== "officer"} className="size-5" />
        Signer{!hasWallet && <span className="text-xs text-amber-700">(no wallet)</span>}
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <div className="sm:col-span-4">
        <Status msg={state} />
      </div>
    </form>
  );
}

export function PresidentSignerToggle({ orgId, isSigner }: { orgId: string; isSigner: boolean }) {
  const { pending, msg, go } = useAction();
  return (
    <div className="space-y-2">
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="size-5" checked={isSigner} disabled={pending} onChange={(e) => go(() => setPresidentSigner(orgId, e.target.checked))} />
        I am also a signer (I approve expenses on-chain)
      </label>
      {msg?.error && <Notice tone="red">{msg.error}</Notice>}
    </div>
  );
}

export function OrgSettingsForm({ orgId, name, description, college }: { orgId: string; name: string; description: string | null; college: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: Msg, form: FormData) => {
    const res = await updateOrgSettings(prev, form);
    router.refresh();
    return res;
  }, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <Field label="Organization name">
        <input name="name" className={inputCls} defaultValue={name} required minLength={3} maxLength={100} />
      </Field>
      <Field label="Description">
        <textarea name="description" className={`${inputCls} min-h-24`} defaultValue={description ?? ""} maxLength={500} />
      </Field>
      <Field label="College / institute">
        <input name="college" className={inputCls} defaultValue={college ?? ""} maxLength={120} />
      </Field>
      <Status msg={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function VerifyButton({ orgId, verified }: { orgId: string; verified: boolean }) {
  const { pending, msg, go } = useAction();
  return (
    <div className="space-y-1">
      <Button variant={verified ? "secondary" : "primary"} className="!min-h-9 text-xs" disabled={pending} onClick={() => go(() => setOrgVerified(orgId, !verified))}>
        {verified ? "Mark unverified" : "Verify"}
      </Button>
      {msg?.error && <Notice tone="red">{msg.error}</Notice>}
    </div>
  );
}
