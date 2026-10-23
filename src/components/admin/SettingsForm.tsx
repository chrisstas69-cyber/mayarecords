"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/lib/actions/settings";
import {
  Button,
  Field,
  Notice,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import type { PromotionConfig } from "@/lib/promotion";

interface SettingsValues {
  hero_headline: string;
  hero_subline: string;
  hero_media_url: string;
  booking_email: string;
  demo_email: string;
  promotion: PromotionConfig;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const setPromotion = (patch: Partial<PromotionConfig>) =>
    setForm((current) => ({
      ...current,
      promotion: { ...current.promotion, ...patch },
    }));

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
      <div className="border border-gold/30 bg-surface p-6">
        <h2 className="display-sm mb-3 text-cream">Featured Promotion</h2>
        <p className="mb-5 text-sm leading-relaxed text-sand">
          The top-right spotlight on the homepage and catalog. Promote a
          release, a genuine presale link, merchandise or any campaign. Leave
          release details blank to use the next upcoming published release,
          otherwise the newest release.
        </p>
        <div className="space-y-5">
          <label className="flex min-h-11 items-center gap-3 text-sm text-cream">
            <input
              type="checkbox"
              checked={form.promotion.enabled}
              onChange={(event) =>
                setPromotion({ enabled: event.target.checked })
              }
            />{" "}
            Show featured promotion
          </label>
          <Field label="Promotion type">
            <Select
              value={form.promotion.kind}
              onChange={(event) =>
                setPromotion({
                  kind: event.target.value as PromotionConfig["kind"],
                })
              }
            >
              <option value="release">Release spotlight</option>
              <option value="presale">Presale / upcoming campaign</option>
              <option value="merch">Merchandise</option>
              <option value="campaign">Other campaign</option>
            </Select>
          </Field>
          <Field
            label="Release slug"
            hint="Optional: maya264. Blank chooses automatically for release promotions. Never exposes drafts or unpublished releases."
          >
            <TextInput
              value={form.promotion.release_slug}
              onChange={(event) =>
                setPromotion({ release_slug: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Badge"
              hint="Optional: New release, Preorder, Limited merch…"
            >
              <TextInput
                maxLength={120}
                value={form.promotion.badge}
                onChange={(event) =>
                  setPromotion({ badge: event.target.value })
                }
              />
            </Field>
            <Field
              label="Title"
              hint="Optional for releases; required for other campaigns."
            >
              <TextInput
                maxLength={120}
                value={form.promotion.title}
                onChange={(event) =>
                  setPromotion({ title: event.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <TextArea
              maxLength={500}
              rows={2}
              value={form.promotion.description}
              onChange={(event) =>
                setPromotion({ description: event.target.value })
              }
            />
          </Field>
          <Field
            label="Public artwork URL"
            hint="A public HTTPS image or site path, such as /images/merch/shirt.jpg. Never paste private storage URLs or credentials."
          >
            <TextInput
              value={form.promotion.image_url}
              onChange={(event) =>
                setPromotion({ image_url: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Main button label">
              <TextInput
                maxLength={120}
                value={form.promotion.primary_label}
                onChange={(event) =>
                  setPromotion({ primary_label: event.target.value })
                }
              />
            </Field>
            <Field
              label="Main button destination"
              hint="/store, /releases/maya264, or a verified HTTPS presale/merch page."
            >
              <TextInput
                value={form.promotion.primary_url}
                onChange={(event) =>
                  setPromotion({ primary_url: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Second button label (optional)">
              <TextInput
                maxLength={120}
                value={form.promotion.secondary_label}
                onChange={(event) =>
                  setPromotion({ secondary_label: event.target.value })
                }
              />
            </Field>
            <Field label="Second button destination">
              <TextInput
                value={form.promotion.secondary_url}
                onChange={(event) =>
                  setPromotion({ secondary_url: event.target.value })
                }
              />
            </Field>
          </div>
          <p className="text-xs leading-relaxed text-sand">
            The promotion links to the destination you provide. It does not
            create a preorder product, change prices, enable payments or
            schedule delivery.
          </p>
        </div>
      </div>
      <div className="border border-line bg-surface p-6">
        <h2 className="display-sm mb-3 text-cream">Archived hero copy</h2>
        <p className="mb-5 text-sm text-sand">
          Retained from the previous cinematic homepage. The new catalog-first
          front page uses the Featured Promotion above.
        </p>
        <div className="space-y-5">
          <Field label="Headline">
            <TextInput
              value={form.hero_headline}
              onChange={(e) =>
                setForm({ ...form, hero_headline: e.target.value })
              }
            />
          </Field>
          <Field label="Subline">
            <TextArea
              rows={2}
              value={form.hero_subline}
              onChange={(e) =>
                setForm({ ...form, hero_subline: e.target.value })
              }
            />
          </Field>
          <Field
            label="Hero image / video URL"
            hint="Paste a URL from the Media Library. A .mp4/.webm URL becomes a looping background video; an image gets the drift + parallax treatment."
          >
            <TextInput
              type="url"
              value={form.hero_media_url}
              onChange={(e) =>
                setForm({ ...form, hero_media_url: e.target.value })
              }
              placeholder="https://…/storage/v1/object/public/video/hero.mp4"
            />
          </Field>
        </div>
      </div>

      <div className="border border-line bg-surface p-6">
        <h2 className="display-sm mb-5 text-cream">Contact</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Booking email">
            <TextInput
              type="email"
              value={form.booking_email}
              onChange={(e) =>
                setForm({ ...form, booking_email: e.target.value })
              }
            />
          </Field>
          <Field label="Demo submission email">
            <TextInput
              type="email"
              value={form.demo_email}
              onChange={(e) => setForm({ ...form, demo_email: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {status === "saved" && (
        <Notice tone="success">
          Settings saved — the site updates within a few minutes.
        </Notice>
      )}
      {status === "error" && <Notice tone="error">{error}</Notice>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
