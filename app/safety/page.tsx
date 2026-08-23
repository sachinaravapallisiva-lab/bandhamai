import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";
import { VIOLET } from "../../lib/theme";

export const metadata: Metadata = {
  title: "Safety",
  description: "Community guidelines for Bandham AI: 18+, honest profiles, reporting and blocking, and meeting in public.",
};

export default function SafetyPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="SAFETY"
        title="Community guidelines"
        lede="Bandham AI is for adults looking for a marriage-minded match in India and the US diaspora. These rules are about how people treat each other here. They are not a claim that the service is the safest or most trusted site, and they are not a substitute for local police."
      >
        <LegalSection title="Age">
          <p style={{ margin: 0 }}>
            You must be 18 or older. The person on the profile must be 18 or older. Do not create a profile for a minor. We will close underage accounts when we find them.
          </p>
        </LegalSection>

        <LegalSection title="Honest, marriage-minded use">
          <LegalList
            items={[
              "Be honest about who you are, where you live, and your situation (including visa or family facts you choose to list)",
              "A relative may help only with that adult's knowledge",
              "No harassment, slurs, threats, or pressure to meet, marry, or send money",
              "Stop contacting someone who asks you to",
              "No fake profiles, catfishing, or someone else's photos",
              "No scraping or automated collection of people on the site",
            ]}
          />
        </LegalSection>

        <LegalSection title="Block and report">
          <p style={{ margin: "0 0 8px" }}>
            Signed-in members can <strong>Block</strong> or <strong>Report</strong> from a Browse or Matches card, and from a live conversation at{" "}
            <Link href="/chat" style={{ color: VIOLET }}>
              /chat
            </Link>
            . Block hides that person on your Browse list and should stop messaging both ways. Report writes a review row we can look at. It is not a police report and it does not promise a response time.
          </p>
          <LegalList
            items={[
              "The name or profile you saw",
              "What was said or sent, and about when",
              "Whether you want the person hidden from you, the profile taken down, or both",
            ]}
          />
          <p style={{ margin: "10px 0 0" }}>
            If someone is in immediate danger, contact local authorities first. We are not an emergency service and we do not dispatch police.
          </p>
        </LegalSection>

        <LegalSection title="Common matrimony harm">
          <p style={{ margin: "0 0 8px" }}>
            Treat these as warning signs, whether the person is in India or abroad:
          </p>
          <LegalList
            items={[
              "A rush to leave the app, then a request for money, gold, tickets, or a visa fee",
              "A request for Aadhaar, passport, OTP, or bank details before you have met in a safe public place",
              "A dowry demand, or a fee to 'confirm' the match",
              "A story that only a wire transfer can fix (medical, customs, airport, or legal trouble)",
            ]}
          />
        </LegalSection>

        <LegalSection title="Meeting in person">
          <p style={{ margin: 0 }}>
            Meet in a public place. Tell a friend or family member. Arrange your own travel. Do not send money, visa paperwork, or tickets to someone you only know here. A quiet VerifyAI badge appears only when that profile has a stored verified status. It is not a substitute for your own caution.
          </p>
        </LegalSection>

        <LegalSection title="Profiles">
          <p style={{ margin: 0 }}>
            New profiles stay pending until manual approval. A photo uploaded on profile create follows that same review path. Approval is not a background check. Fake profiles are not allowed and will be taken down when we find them. A profile photo must be of the person on the profile, recent, and not someone else&apos;s picture. Optional enhance only changes resolution and clarity. It does not reshape a face or smooth skin, and it is not a reason to trust a photo on its own.
          </p>
        </LegalSection>

        <LegalSection title="Account removal">
          <p style={{ margin: 0 }}>
            Signed-in members can delete an account on the{" "}
            <Link href="/account" style={{ color: VIOLET }}>
              Account
            </Link>{" "}
            page. That tries to remove the login and hide the profile. If the login cannot be removed automatically, we keep a deletion request. Some safety reports may be kept if a case is still open.
          </p>
        </LegalSection>

        <LegalSection title="What we may do">
          <p style={{ margin: 0 }}>
            After a report, or if we see a rule break, we may hide a profile, limit messaging, or close an account. We may also keep a record of the report so the same harm is harder to repeat.
          </p>
        </LegalSection>
      </LegalArticle>
    </AppChrome>
  );
}
