"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Notice, TextInput } from "@/components/admin/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(searchParams.get("next") ?? "/admin");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Account created. If email confirmation is enabled, check your inbox — then an admin must approve your role.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Image
            src="/images/logos/maya-white.png"
            alt="Maya Records"
            width={130}
            height={54}
            className="mx-auto h-12 w-auto"
          />
          <p className="eyebrow mt-4">Label Portal</p>
        </div>

        <form onSubmit={submit} className="space-y-5 border border-line bg-surface p-7">
          <Field label="Email">
            <TextInput
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mayarecords.com"
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <Notice tone="error">{error}</Notice>}
          {info && <Notice tone="success">{info}</Notice>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "One moment…" : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="w-full text-center text-xs text-stone transition-colors hover:text-gold"
          >
            {mode === "signin" ? "First time? Create an account" : "Already set up? Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">
          Access is granted by the label. New accounts start without a role until approved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
