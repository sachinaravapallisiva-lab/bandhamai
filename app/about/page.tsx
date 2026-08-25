import type { Metadata } from "next";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import LegalArticle, { LegalSection } from "../components/LegalArticle";

export const metadata: Metadata = {
  title: "About",
  description: "About Bandham AI and our goals. Indian matrimony for NRI and diaspora first.",
};

export default function AboutPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <LegalArticle
        kicker="ABOUT"
        title="About"
        lede="Bandham AI. Find your vibe match? This page covers the company and our goals."
      >
        <LegalSection title="About our company">
          <p style={{ margin: 0 }}>
            Bandham AI is Indian matrimony for NRI and diaspora first. We serve adults 18 and over in the US, Australia, UK, Europe, and Ireland.
          </p>
        </LegalSection>

        <LegalSection title="Goals">
          <p style={{ margin: "0 0 8px" }}>
            We help people find a vibe match. We help them talk to her parents. Guru coaches those talks and never writes sendable dating text.
          </p>
          <p style={{ margin: 0 }}>
            Browse, search, Speed Match, and creating a profile stay free. A Bandham AI subscription is $9.99 a month. VerifyAI and meetup are separate.
          </p>
        </LegalSection>
      </LegalArticle>
    </AppChrome>
  );
}
