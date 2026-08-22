import type { Metadata } from "next";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bandham AI handles account, profile, message, and voice data for users in India and the United States.",
};

export default function PrivacyPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="PRIVACY"
        title="Privacy Policy"
        lede="This page describes how Bandham AI handles personal information for people in India and the US diaspora who use the site."
      >
        <LegalSection title="What we collect">
          <LegalList
            items={[
              "Account email and sign-in data from our login provider",
              "Profile details you submit, such as name, gender, city, and optional fields (language, visa status, education, work, and what you want)",
              "Messages you send in chat, when that feature is used",
              "Voice you choose to send for speech-to-text search or the assistant. Audio goes to a transcription service so we can return text.",
              "Basic device and usage logs the host needs to run and secure the site",
            ]}
          />
          <p style={{ margin: "10px 0 0" }}>
            We do not ask for a payment card on the site today.
          </p>
        </LegalSection>

        <LegalSection title="Why we use it">
          <p style={{ margin: 0 }}>
            To run accounts, review profiles, show matches, operate search and chat, keep the service safer, and reach you about your account.
          </p>
        </LegalSection>

        <LegalSection title="Sharing">
          <p style={{ margin: "0 0 8px" }}>We share data with:</p>
          <LegalList
            items={[
              "Infrastructure we already use (hosting, database, transcription)",
              "Reviewers who decide if a profile can go live",
              "Authorities when the law requires it",
            ]}
          />
          <p style={{ margin: "10px 0 0" }}>
            We do not sell profile lists.
          </p>
        </LegalSection>

        <LegalSection title="VerifyAI">
          <p style={{ margin: 0 }}>
            If VerifyAI ships, it may process extra signals you choose to provide. It will stay optional. This policy will be updated before that is a live product.
          </p>
        </LegalSection>

        <LegalSection title="How long we keep it">
          <p style={{ margin: 0 }}>
            Account and profile data stay while the account is open. Safety and review notes may be kept longer if needed to handle abuse. Voice is processed to produce text. We do not present recordings as a public archive.
          </p>
        </LegalSection>

        <LegalSection title="Your choices">
          <p style={{ margin: 0 }}>
            In-app edit and delete tools are limited today. To correct a profile or ask us to remove an account, use the Contact page. We will handle those requests by hand until self-serve tools ship.
          </p>
        </LegalSection>

        <LegalSection title="Children">
          <p style={{ margin: 0 }}>
            The service is not for anyone under 18. We do not knowingly collect data from minors.
          </p>
        </LegalSection>

        <LegalSection title="India and the United States">
          <p style={{ margin: 0 }}>
            If you are in India, you may have rights under the Digital Personal Data Protection Act and other Indian rules. If you are in the United States, state privacy laws may apply depending on where you live. This summary is not a full notice under every statute.
          </p>
        </LegalSection>

        <LegalSection title="Changes">
          <p style={{ margin: 0 }}>
            We will update this page when our practices change. The date at the top is the last edit.
          </p>
        </LegalSection>
      </LegalArticle>
    </AppChrome>
  );
}
