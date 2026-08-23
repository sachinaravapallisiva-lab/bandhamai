import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalList, LegalSection } from "../components/LegalArticle";
import { VIOLET } from "../../lib/theme";

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
        lede="These terms govern Bandham AI, a matrimony service for adults in India and the Indian diaspora in the United States. They cover the website and any app that loads it. By creating an account, submitting a profile, or using Browse, Matches, or Chat, you agree to them."
      >
        <LegalSection title="What Bandham AI is">
          <p style={{ margin: 0 }}>
            Bandham AI helps adults look for a marriage-minded match. It is not a marriage bureau that promises a wedding, not a background-check firm, and not an immigration or visa service. We do not claim awards, user counts, or a special trusted rank. Use the profiles and messages as a starting point, then use your own judgment.
          </p>
        </LegalSection>

        <LegalSection title="Eligibility">
          <p style={{ margin: 0 }}>
            You must be 18 or older. The person named on a profile must also be 18 or older. A parent or relative may help only if that adult knows about the profile and agrees to it. Do not create an account or a profile for a minor. If we learn someone under 18 is on the service, we will close that account.
          </p>
        </LegalSection>

        <LegalSection title="Accounts">
          <p style={{ margin: 0 }}>
            Keep the email and password you use private. One person should not run a stack of accounts to dodge review or a ban. Do not open an account in someone else&apos;s name without their clear permission. We may suspend or close an account that looks abusive, duplicated, or unsafe.
          </p>
        </LegalSection>

        <LegalSection title="Profiles and review">
          <p style={{ margin: 0 }}>
            Profiles go to manual review and stay pending until a reviewer sets them live. Photos uploaded with a profile follow that same review path. A profile is not public on Browse until it is live. Facts you list (city, work, visa status, family notes, and the rest) must be true to the best of your knowledge. We can refuse, hide, or take down a profile that looks fake, incomplete, or harmful. Approval is a publishing step, not a police check, credit check, or visa check.
          </p>
        </LegalSection>

        <LegalSection title="Messaging">
          <p style={{ margin: 0 }}>
            Chat is for respectful, marriage-minded conversation. Do not send threats, spam, or sexual messages the other person did not ask for. Do not keep writing after someone asked you to stop. Do not use chat to sell goods, loans, crypto, or a job. Sending messages requires an active $9.99/month subscription. Browse, search, Speed Match, and creating a profile stay free. The subscription is access to messaging. It is not a promise of a match, a meeting, or a marriage.
          </p>
        </LegalSection>

        <LegalSection title="Photos">
          <p style={{ margin: "0 0 8px" }}>
            Signed-in users can upload a photo when they create a profile. It must be of the person on the profile, recent, and not taken from someone else. Do not post other people&apos;s pictures.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            Enhance is optional. If you use it, we only change resolution and clarity (rotate, resize, and a mild sharpen). We do not apply beauty filters, reshape a face, or smooth skin, and we do not rewrite how you look.
          </p>
          <p style={{ margin: 0 }}>
            A photo follows the same path as the rest of the profile. It stays pending until a reviewer sets the profile live. We may store a blurred copy for product use. That is not a live hide-until-matched feature. Once the profile is live, treat the photo we display as visible to other members.
          </p>
        </LegalSection>

        <LegalSection title="VerifyAI">
          <p style={{ margin: 0 }}>
            VerifyAI is an optional check on a Bandham profile. A quiet badge appears only when we have a stored verified status for that profile. It is not a background check, a visa check, or a promise that someone is who they say they are.
          </p>
        </LegalSection>

        <LegalSection title="Money, dowry, and papers">
          <p style={{ margin: 0 }}>
            Do not ask for or offer dowry, gifts-for-marriage, or a fee to &quot;arrange&quot; a match through this service. Do not use Bandham AI to coach visa fraud or to trade a marriage for immigration papers. Do not send money, gold, tickets, or government-ID scans to someone you only know here.
          </p>
        </LegalSection>

        <LegalSection title="What we do not allow">
          <LegalList
            items={[
              "Fake or borrowed identities, including using someone else's photos",
              "Scraping, bots, or bulk collection of profiles",
              "Harassment, stalking, or contact after someone asked you to stop",
              "Commercial pitches, loans, crypto, or job offers",
              "Creating many accounts to dodge a ban or skip review",
            ]}
          />
        </LegalSection>

        <LegalSection title="Payments">
          <p style={{ margin: 0 }}>
            Messaging is $9.99 per month, billed by Stripe through Checkout. The price is shown before you pay. You can manage or cancel in the Stripe customer portal. We do not store your full card number. Refunds, if any, follow Stripe and the card network rules that apply to you. A subscription does not guarantee that anyone will reply, that you will match, or that you will meet. Browse stays free if you do not subscribe. This page is a working draft and should be reviewed by a lawyer before you rely on it as a price contract.
          </p>
        </LegalSection>

        <LegalSection title="Meetings and our role">
          <p style={{ margin: 0 }}>
            If you meet someone in person, you do that at your own risk. Meet in public. Tell someone you trust where you are going. We do not guarantee a match, a marriage, or another user&apos;s conduct, income, family, or visa status.
          </p>
        </LegalSection>

        <LegalSection title="Your content">
          <p style={{ margin: 0 }}>
            You keep ownership of the words and photos you submit. You give Bandham AI a license to host, review, process (including a resolution pass and a blurred copy), and show that content to other members as part of the service. You also confirm you have the right to share it. We may remove content that breaks these terms.
          </p>
        </LegalSection>

        <LegalSection title="Ending use">
          <p style={{ margin: 0 }}>
            You may stop using the service at any time. Signed-in members can delete an account on the{" "}
            <Link href="/account" style={{ color: VIOLET }}>
              Account
            </Link>{" "}
            page. That tries to remove the login and hide the profile. We may end or limit access if you break these terms or if we shut a feature down.
          </p>
        </LegalSection>

        <LegalSection title="Limits of our responsibility">
          <p style={{ margin: 0 }}>
            The service is provided as it stands. Search, review, chat, and voice tools can fail or be unavailable. To the extent the law allows, Bandham AI is not liable for other users&apos; words or meetings, or for losses that come from relying on a profile. Some consumer rights cannot be waived. Those stay in place.
          </p>
        </LegalSection>

        <LegalSection title="Governing law">
          <p style={{ margin: 0 }}>
            This draft does not name a single court or company registration. People in India and the United States remain covered by the consumer and privacy laws that already apply to them. A lawyer should set the governing law and venue before you rely on this section.
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
