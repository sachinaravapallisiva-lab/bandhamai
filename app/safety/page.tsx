import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";
import { VIOLET } from "../../lib/theme";

export const metadata: Metadata = {
  title: "Safety",
  description: "Community guidelines for Bandham AI: 18+, honest profiles, no harassment, and meeting in public.",
};

export default function SafetyPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="SAFETY"
        title="Community guidelines"
        lede="Bandham AI is for adults looking for marriage-minded matches in India and the US diaspora. It is not a casual pinboard."
      >
        <LegalSection title="Age">
          <p style={{ margin: 0 }}>
            You must be 18 or older. Do not create a profile for a minor. We will close underage accounts when we find them.
          </p>
        </LegalSection>

        <LegalSection title="How we expect you to behave">
          <LegalList
            items={[
              "Be honest about who you are",
              "No harassment, slurs, threats, or pressure",
              "Stop contacting someone who asks you to",
              "No fake profiles, catfishing, or someone else's photos",
              "No scraping or automated collection of people on the site",
            ]}
          />
        </LegalSection>

        <LegalSection title="Block and report">
          <p style={{ margin: 0 }}>
            In-app block and report tools are planned. Until they ship, use the{" "}
            <Link href="/contact" style={{ color: VIOLET }}>
              Contact
            </Link>{" "}
            page with the person&apos;s name or profile details and what happened. If someone is in immediate danger, contact local police first. We are not an emergency service.
          </p>
        </LegalSection>

        <LegalSection title="Meeting in person">
          <p style={{ margin: 0 }}>
            Meet in a public place. Tell a friend or family member. Do not send money, visa paperwork, or travel tickets to someone you only know here. VerifyAI, when it exists, is a quiet helper. It is not a substitute for your own caution.
          </p>
        </LegalSection>

        <LegalSection title="Profiles">
          <p style={{ margin: 0 }}>
            New profiles wait for manual approval. Approval is not a background check. Fake profiles are not allowed and will be taken down when we find them.
          </p>
        </LegalSection>

        <LegalSection title="Account removal">
          <p style={{ margin: 0 }}>
            Self-serve account deletion is not in the app yet. Ask for removal on the Contact page. We will handle those requests until in-app tools ship.
          </p>
        </LegalSection>

        <LegalSection title="What we may do">
          <p style={{ margin: 0 }}>
            We may hide a profile, limit messaging, or close an account that breaks these rules.
          </p>
        </LegalSection>
      </LegalArticle>
    </AppChrome>
  );
}
