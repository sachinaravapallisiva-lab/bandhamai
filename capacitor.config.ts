import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The live site is a Next.js App Router app (API routes, Supabase, Grok STT).
 * A static export would require rewriting those server pieces. The iOS shell
 * therefore loads the hosted Vercel URL in the WebView.
 *
 * Capacitor documents `server.url` as a live-reload / remote-load option, not
 * the long-term App Store default. That is the deliberate v1 tradeoff: same UI
 * as https://bandhamai.vercel.app, no Next rewrite. Revisit if Apple review
 * wants more native surface area.
 */
const config: CapacitorConfig = {
  appId: "com.bandhamai.app",
  appName: "Bandham AI",
  webDir: "ios-shell",
  backgroundColor: "#ffffff",
  server: {
    url: "https://bandhamai.vercel.app",
    cleartext: false,
    errorPath: "offline.html",
    allowNavigation: ["bandhamai.vercel.app"],
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    backgroundColor: "#ffffff",
  },
};

export default config;
