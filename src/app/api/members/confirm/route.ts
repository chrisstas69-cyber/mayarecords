import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { MEMBER_COOKIE } from "@/lib/members";

/** Stripe Checkout success → verify the session, then remember the subscription on this device. */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const back = new URL("/members", req.url);
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return NextResponse.redirect(back);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  const subId = typeof session?.subscription === "string" ? session.subscription : session?.subscription?.id;
  if (!session || session.status !== "complete" || !subId) return NextResponse.redirect(back);

  back.searchParams.set("welcome", "1");
  const res = NextResponse.redirect(back);
  res.cookies.set(MEMBER_COOKIE, subId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
