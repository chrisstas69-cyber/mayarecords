"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { exitEpk, registerPromoter, returningPromoter } from "@/lib/actions/epk";

const input =
  "w-full border border-line-strong bg-night px-4 py-3 text-sm text-cream placeholder:text-faint focus:border-gold focus:outline-none";
const label = "mb-1.5 block text-[0.65rem] uppercase tracking-[0.22em] text-stone";
const primary =
  "bg-gold px-7 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-night transition-colors hover:bg-gold-bright disabled:opacity-60";

const ROLES = ["Promoter", "Venue / Club", "Booking Agent", "Festival", "Press / Media", "Other"];

export function PromoterRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await registerPromoter(fd);
          if (res.ok) router.refresh();
          else setError(res.error ?? "Something went wrong.");
        })
      }
    >
      <div>
        <label className={label} htmlFor="name">Full name *</label>
        <input id="name" name="name" required className={input} autoComplete="name" />
      </div>
      <div>
        <label className={label} htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" required className={input} autoComplete="email" />
      </div>
      <div>
        <label className={label} htmlFor="company">Company / event / venue *</label>
        <input id="company" name="company" required className={input} autoComplete="organization" />
      </div>
      <div>
        <label className={label} htmlFor="role">You are a… *</label>
        <select id="role" name="role" required defaultValue="" className={input}>
          <option value="" disabled>Select one</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="city">City *</label>
        <input id="city" name="city" required className={input} autoComplete="address-level2" />
      </div>
      <div>
        <label className={label} htmlFor="country">Country *</label>
        <input id="country" name="country" required className={input} autoComplete="country-name" />
      </div>
      <div>
        <label className={label} htmlFor="phone">Phone / WhatsApp</label>
        <input id="phone" name="phone" type="tel" className={input} autoComplete="tel" />
      </div>
      <div>
        <label className={label} htmlFor="instagram">Instagram</label>
        <input id="instagram" name="instagram" placeholder="@yourpromo" className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="website">Website</label>
        <input id="website" name="website" type="url" placeholder="https://" className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="event_details">Thinking of booking? Tell us about the date / event</label>
        <textarea id="event_details" name="event_details" rows={3} className={input} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "…" : "Unlock the press kit"}
        </button>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <p className="mt-4 text-xs text-faint">
          Your details go to the Joeski / Maya Records team only and are used for booking and press contact.
        </p>
      </div>
    </form>
  );
}

export function ReturningPromoterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await returningPromoter(email);
          if (res.ok) router.refresh();
          else setError(res.error ?? "Something went wrong.");
        });
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourpromo.com"
        aria-label="Email"
        className={input}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 border border-line-strong px-6 py-3 text-[0.7rem] uppercase tracking-[0.22em] text-sand hover:border-gold hover:text-gold"
      >
        {pending ? "…" : "Sign in"}
      </button>
      {error && <p className="text-sm text-error sm:basis-full">{error}</p>}
    </form>
  );
}

export function ExitEpkButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await exitEpk();
          router.refresh();
        })
      }
      className="text-[0.7rem] uppercase tracking-[0.22em] text-stone underline-offset-4 hover:text-gold hover:underline"
    >
      Sign out
    </button>
  );
}
