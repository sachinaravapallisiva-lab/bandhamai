import type { Metadata } from "next";
import {
  PLANS_BODY,
  PLANS_KICKER,
  PLANS_TITLE,
} from "../../lib/plans";
import { MUTED } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import PlansPanel from "../components/PlansPanel";

export const metadata: Metadata = {
  title: PLANS_TITLE,
  description: "Bandham AI, Priority, VerifyAI, and Meetup this month.",
};

export default function PlansPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {PLANS_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {PLANS_TITLE}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {PLANS_BODY}
      </p>
      <PlansPanel />
    </AppChrome>
  );
}
