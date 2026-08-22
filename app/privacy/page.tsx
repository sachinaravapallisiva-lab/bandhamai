import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";
import { VIOLET } from "../../lib/theme";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bandham AI handles account, profile, photo, message, and voice data for users in India and the United States.",
};

export default function PrivacyPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="PRIVACY"
        title="Privacy Policy"
        lede="This policy explains how Bandham AI handles personal information for adults in India and the US diaspora who use the matrimony service. It is a working notice, not a claim that we hold a privacy award or a certified seal."
      >
        <LegalSection title="Who this covers">
          <p style={{ margin: 0 }}>
            It covers people who create an account, submit a profile, browse, use chat, or use voice search or the assistant. If a relative helps you fill a profile, the adult on the profile is still the person this policy is about.
          </p>
        </LegalSection>

        <LegalSection title="What we collect">
          <LegalList
            items={[
              "Account email and sign-in data from our login provider",
              "Profile details you submit, such as name, gender, city, and optional fields (language, visa status, education, work, and what you want in a match)",
              "A profile photo you choose to upload. We may create a clearer or resized copy (resolution and sharpness only) and a blurred copy for product use.",
              "Messages you send in chat, when that feature is used",
              "Voice you choose to send for speech-to-text search or the assistant. Audio goes to a transcription service so we can return text.",
              "Basic device and usage logs the host needs to run and secure the site",
            ]}
          />
          <p style={{ margin: "10px 0 0" }}>
            We do not ask for a payment card, Aadhaar number, or passport scan on the site today. Do not put those in your profile or in chat.
          </p>
        </LegalSection>

        <LegalSection title="Why we use it">
          <p style={{ margin: 0 }}>
            To run accounts, review profiles, show possible matches, operate search and chat, look into abuse, and reach you about your account. We use profile fields (city, language, work, and similar) to shortlist people, not to sell a marketing list.
          </p>
        </LegalSection>

        <LegalSection title="Who can see a profile">
          <p style={{ margin: 0 }}>
            After a reviewer sets a profile live, other members can see the fields we display on Browse and Matches, including the profile photo we show. Reviewers can see a submitted profile and its photo before it is live. Chat is visible to the people in that thread and to operators if we must look at a report. Voice is processed to produce text for the feature you used. It is not posted as a public recording.
          </p>
        </LegalSection>

        <LegalSection title="Sharing">
          <p style={{ margin: "0 0 8px" }}>We share data with:</p>
          <LegalList
            items={[
              "Infrastructure we already use (hosting, database, login, storage, transcription)",
              "Reviewers who decide if a profile can go live",
              "Authorities when the law requires it, or when we believe there is a serious risk of harm",
            ]}
          />
          <p style={{ margin: "10px 0 0" }}>
            We do not sell profile lists. We do not publish member counts or a &quot;most trusted&quot; ranking based on your data.
          </p>
        </LegalSection>

        <LegalSection title="Photos and enhance">
          <p style={{ margin: 0 }}>
            Photo enhance, when you use it, is a resolution and clarity pass only (rotate, resize, mild sharpen). It is not a beauty filter and it does not change your face or skin. We may store a blurred derivative. Hide-until-matched is not a live guarantee on the site today. Do not upload Aadhaar, passport, or other ID photos as a profile picture.
          </p>
        </LegalSection>

        <LegalSection title="VerifyAI">
          <p style={{ margin: 0 }}>
            If VerifyAI ships, it may process extra signals you choose to provide. It will stay optional. This policy will be updated before that is a live product.
          </p>
        </LegalSection>

        <LegalSection title="India and the United States">
          <p style={{ margin: 0 }}>
            The service is used from India and the United States, so account and profile data may be stored or processed in either place through our hosts. If you are in India, you may have rights under the Digital Personal Data Protection Act and other Indian rules. If you are in the United States, state privacy laws may apply depending on where you live. This summary is not a full notice under every statute.
          </p>
        </LegalSection>

        <LegalSection title="How long we keep it">
          <p style={{ margin: 0 }}>
            Account, profile, and photo data stay while the account is open. Safety and review notes may be kept longer if needed to handle abuse. Voice is processed to produce text. We do not present recordings as a public archive.
          </p>
        </LegalSection>

        <LegalSection title="Your choices">
          <p style={{ margin: 0 }}>
            In-app edit and delete tools are limited today. To correct a profile, ask for a copy of what we have, or ask us to close an account, use the{" "}
            <Link href="/contact" style={{ color: VIOLET }}>
              Contact
            </Link>{" "}
            page. We will handle those requests by hand until self-serve tools ship. Some records (for example a safety report) may need to be kept if the law or an open case requires it.
          </p>
        </LegalSection>

        <LegalSection title="Cookies and local storage">
          <p style={{ margin: 0 }}>
            We use what the site needs to stay signed in and to run the pages. We do not run a separate advertising cookie program on these pages.
          </p>
        </LegalSection>

        <LegalSection title="Children">
          <p style={{ margin: 0 }}>
            The service is not for anyone under 18. We do not knowingly collect data from minors.
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
