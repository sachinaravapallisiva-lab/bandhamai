/**
 * Priority pin checkout. Show the $4.99 for 7 days cost in the UI.
 * Fail closed here. Do not invent a Stripe Price ID. Do not invent STRIPE_PIN_PRICE_ID.
 * Live paid pin stays parked until a real pin Price exists.
 */
import { NextResponse } from "next/server";
import { pinCheckoutNotConfiguredPayload } from "../../../../lib/browse-pin";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(pinCheckoutNotConfiguredPayload(), { status: 503 });
}
