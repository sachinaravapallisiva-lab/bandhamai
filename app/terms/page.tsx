import type { Metadata } from "next";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Bandham AI, a matrimony service for adults in India and the US diaspora.",
};

export default function TermsPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="TERMS"
        title="Terms of Service"
        lede="Bandham AI is a matrimony service for adults in India and the Indian diaspora in the United States. These terms cover the website and any app that loads it."
      >
        <LegalSection title="Eligibility">
          <p style={{ margin: 0 }}>
            You must be 18 or older. Do not create an account or a profile for a minor. If we learn an account belongs to someone under 18, we will close it.
          </p>
        </LegalSection>

        <LegalSection title="Accounts">
          <p style={{ margin: 0 }}>
            You are responsible for the email and password you use. Keep them private. Do not open an account in someone else&apos;s name without their clear permission. We may suspend or close an account that looks abusive, duplicated, or unsafe.
          </p>
        </LegalSection>

        <LegalSection title="Profiles and review">
          <p style={{ margin: 0 }}>
            New profiles are submitted for manual review. A profile is not public on Browse until a reviewer sets it live. We can refuse, hide, or take down a profile that looks fake, incomplete, or harmful. Approval is a publishing step, not a background check.
          </p>
        </LegalSection>

        <LegalSection title="Messaging">
          <p style={{ margin: 0 }}>
            Chat is for respectful, marriage-minded conversation. Do not send threats, spam, or sexual messages that the other person did not ask for. Do not press someone who asked you to stop. Paid messaging may be added later as an extra. There is no paid checkout on the site today, and these terms do not describe a live payment product.
          </p>
        </LegalSection>

        <LegalSection title="Photos">
          <p style={{ margin: 0 }}>
            Photo upload is not offered yet. When it is, photos must be of you, recent, and not taken from someone else. Do not post other people&apos;s pictures.
          </p>
        </LegalSection>

        <LegalSection title="VerifyAI">
          <p style={{ margin: 0 }}>
            VerifyAI is an optional, planned check. A quiet badge may appear on some profiles. It is not a police record, visa check, or a promise that someone is who they say they are.
          </p>
        </LegalSection>

        <LegalSection title="What we do not allow">
          <LegalList
            items={[
              "Fake or borrowed identities",
              "Scraping, bots, or bulk collection of profiles",
              "Harassment, stalking, or contact after someone asked you to stop",
              "Using the service to sell goods, loans, or crypto",
              "Creating many accounts to dodge a ban or skip review",
            ]}
          />
        </LegalSection>

        <LegalSection title="Payments">
          <p style={{ margin: 0 }}>
            If we later charge for extra messaging or similar features, the screen will say so before you pay. Do not treat this page as a price list or a Stripe checkout.
          </p>
        </LegalSection>

        <LegalSection title="Meetings and conduct">
          <p style={{ margin: 0 }}>
            Bandham AI helps people meet. We do not guarantee a match, a marriage, or another user&apos;s conduct. Meet in public. Tell someone you trust where you are going. Do not send money, visa papers, or tickets to someone you only know here.
          </p>
        </LegalSection>

        <LegalSection title="Governing law">
          <p style={{ margin: 0 }}>
            This draft does not name a single court or statute. People in India and the United States remain covered by the consumer and privacy laws that already apply to them. A lawyer should set the governing law and venue before you rely on this section.
          </p>
        </LegalSection>

        <LegalSection title="Changes">
          <p style={{ margin: 0 }}>
            We may update these terms. The date at the top is the last edit. If you keep using the service after a change, you accept the new version unless a law says otherwise.
          </p>
        </LegalSection>
      </LegalArticle>
    </AppChrome>
  );
}
