"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enableDemoAccess, joinMailingList, signOutMember, startMembershipCheckout } from "@/lib/actions/members";

const inputCls =
  "w-full border border-line-strong bg-night px-4 py-3.5 text-sm text-cream placeholder:text-faint focus:border-gold focus:outline-none";
const primaryBtn =
  "bg-gold px-7 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-night transition-colors hover:bg-gold-bright disabled:opacity-60";
const ghostBtn =
  "border border-line-strong px-6 py-3 text-[0.7rem] uppercase tracking-[0.22em] text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-60";

export function JoinForm({ showDemo }: { showDemo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="w-full max-w-md">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const res = await startMembershipCheckout(email);
            if (res.ok && res.data) window.location.href = res.data.url;
            else setError(res.error ?? "Something went wrong.");
          });
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email"
          className={inputCls}
        />
        <button type="submit" disabled={pending} className={`${primaryBtn} shrink-0`}>
          {pending ? "…" : "Join — $10/mo"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
      {showDemo && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await enableDemoAccess();
              router.refresh();
            })
          }
          className={`${ghostBtn} mt-4`}
        >
          Preview as a member (demo)
        </button>
      )}
    </div>
  );
}

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (state === "done") {
    return <p className="text-sm text-gold">You&apos;re on the list. Watch your inbox for the next drop.</p>;
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await joinMailingList(email);
          if (res.ok) setState("done");
          else {
            setState("error");
            setError(res.error ?? "Something went wrong.");
          }
        });
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email"
        className={inputCls}
      />
      <button type="submit" disabled={pending} className={`${ghostBtn} shrink-0`}>
        {pending ? "…" : "Get updates"}
      </button>
      {state === "error" && <p className="text-sm text-error sm:basis-full">{error}</p>}
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOutMember();
          router.refresh();
        })
      }
      className="text-[0.7rem] uppercase tracking-[0.22em] text-stone underline-offset-4 hover:text-gold hover:underline"
    >
      Exit member view
    </button>
  );
}
