"use client";

import { cn } from "@/lib/utils";
import type { PublishState } from "@/lib/types";

/** Shared admin form controls — large touch targets, obvious labels. */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cream">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-stone">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-error">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full border border-line bg-surface px-4 py-3.5 text-[0.95rem] text-cream placeholder:text-faint outline-none transition-colors focus:border-gold/70 disabled:opacity-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn(inputClass, "resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none", props.className)} />;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-[0.78rem] font-medium uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-gold text-night hover:bg-gold-bright",
        variant === "secondary" && "border border-gold/50 text-gold hover:bg-gold hover:text-night",
        variant === "ghost" && "border border-line text-sand hover:border-cream/40 hover:text-cream",
        variant === "danger" && "border border-error/50 text-error hover:bg-error hover:text-night",
        className
      )}
    />
  );
}

const STATE_STYLES: Record<PublishState, string> = {
  draft: "border-stone/50 text-stone",
  scheduled: "border-gold/60 text-gold",
  published: "border-ok/60 text-ok",
  archived: "border-faint text-faint",
};

export function StateBadge({ state }: { state: PublishState }) {
  return (
    <span className={cn("inline-block border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em]", STATE_STYLES[state])}>
      {state}
    </span>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border px-4 py-3 text-sm",
        tone === "info" && "border-line bg-surface text-sand",
        tone === "error" && "border-error/50 bg-error/10 text-error",
        tone === "success" && "border-ok/50 bg-ok/10 text-ok"
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-stone" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-faint border-t-gold" aria-hidden />
      {label}
    </span>
  );
}
