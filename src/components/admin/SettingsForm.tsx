"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/lib/actions/settings";
import { Button, Field, Notice, TextArea, TextInput } from "@/components/admin/ui";

interface SettingsValues {
  hero_headline: string;
  hero_subline: string;
  hero_media_url: string;
  booking_email: string;
  demo_email: string;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await updateSiteSettings(form);
      if (result.ok) setStatus("saved");
      else {
        setStatus("error");
        setError(result.error ?? "Could not save.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="border border-line bg-surface p-6">
        <h2 className="display-sm mb-5 text-cream">Homepage Hero</h2>
        <div className="space-y-5">
          <Field label="Headline">
            <TextInput value={form.hero_headline} onChange={(e) => setForm({ ...form, hero_headline: e.target.value })} />
          </Field>
          <Field label="Subline">
            <TextArea rows={2} value={form.hero_subline} onChange={(e) => setForm({ ...form, hero_subline: e.target.value })} />
          </Field>
          <Field
            label="Hero image / video URL"
            hint="Paste a URL from the Media Library. A .mp4/.webm URL becomes a looping background video; an image gets the drift + parallax treatment."
          >
            <TextInput
              type="url"
              value={form.hero_media_url}
              onChange={(e) => setForm({ ...form, hero_media_url: e.target.value })}
              placeholder="https://…/storage/v1/object/public/video/hero.mp4"
            />
          </Field>
        </div>
      </div>

      <div className="border border-line bg-surface p-6">
        <h2 className="display-sm mb-5 text-cream">Contact</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Booking email">
            <TextInput type="email" value={form.booking_email} onChange={(e) => setForm({ ...form, booking_email: e.target.value })} />
          </Field>
          <Field label="Demo submission email">
            <TextInput type="email" value={form.demo_email} onChange={(e) => setForm({ ...form, demo_email: e.target.value })} />
          </Field>
        </div>
      </div>

      {status === "saved" && <Notice tone="success">Settings saved — the site updates within a few minutes.</Notice>}
      {status === "error" && <Notice tone="error">{error}</Notice>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
