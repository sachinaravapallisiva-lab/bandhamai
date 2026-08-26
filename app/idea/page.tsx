import type { Metadata } from "next";
import FeatureIdeaForm from "../components/FeatureIdeaForm";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import {
  FEATURE_IDEA_BODY,
  FEATURE_IDEA_KICKER,
  FEATURE_IDEA_LABEL,
} from "../../lib/feature-idea";
import { MUTED } from "../../lib/theme";

export const metadata: Metadata = {
  title: FEATURE_IDEA_LABEL,
  description: "Send Bandham AI a product idea from the same queue as app issue tickets.",
};

export default function FeatureIdeaPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {FEATURE_IDEA_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {FEATURE_IDEA_LABEL}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {FEATURE_IDEA_BODY}
      </p>
      <FeatureIdeaForm />
    </AppChrome>
  );
}
