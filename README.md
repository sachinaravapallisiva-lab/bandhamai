This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Live site: [https://bandhamai.vercel.app](https://bandhamai.vercel.app)

The product UI stays the current website look (violet / white, Browse · Matches · Chat). Do not treat this repo as a new visual system until that is an explicit follow-up.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## iOS app (Capacitor)

The iOS target is a Capacitor wrapper around the **hosted** Next.js app. It loads `https://bandhamai.vercel.app` in a WKWebView so the iPhone app matches the website without a static-export rewrite.

That choice is intentional. The site uses App Router API routes (`/api/transcribe`, `/api/chat`, `/api/profiles`), Supabase, and Grok STT. `output: 'export'` would break those and risk the Vercel production deploy. Capacitor still needs a local `webDir` (`ios-shell/`) for the native project and an offline fallback page.

### What this repo already has

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- `capacitor.config.ts` with `appId` `com.bandhamai.app` and `server.url` pointing at the Vercel deploy
- `ios/` Xcode project scaffold (open this on a Mac)
- `ios-shell/offline.html` if the WebView cannot reach the site
- PWA / mobile hardening on the website itself: document title **Bandham AI**, web app manifest, placeholder icons, `viewport-fit=cover`, safe-area padding

### Open the iOS project (Mac required)

You cannot archive or run the Simulator from Linux/Windows. You need Xcode on a Mac, or a cloud Mac (MacStadium, AWS EC2 Mac, GitHub `macos-*` runners, Xcode Cloud).

```bash
npm install
npx cap sync ios
npx cap open ios
```

`npx cap open ios` launches Xcode. This Capacitor 8 scaffold uses Swift Package Manager, not CocoaPods. Open `ios/App/App.xcodeproj` (Xcode will resolve the Capacitor iOS package on first open — that step needs a Mac and network).

First time on a new machine:

1. Run `npx cap sync ios` so `ios/App/App/public` and `capacitor.config.json` exist (they are gitignored native copies of `ios-shell/` and `capacitor.config.ts`).
2. Open `ios/App/App.xcodeproj` in Xcode, or run `npx cap open ios`.
3. In Xcode → Signing & Capabilities, pick your Team and confirm the bundle ID `com.bandhamai.app` (change it if Apple already has that ID).
4. Plug in a phone or pick a Simulator, then Run.

### What still needs an Apple Developer account ($99/yr) and a Mac

This scaffold does **not** ship a TestFlight build. To put Bandham AI on a phone outside your own Xcode-signed device:

| Step | Needs |
| --- | --- |
| Enroll in the Apple Developer Program | $99/year at [developer.apple.com](https://developer.apple.com) |
| Register the bundle ID (`com.bandhamai.app` or a domain you own) | Apple Developer → Identifiers |
| Create an App Store Connect app record | App Store Connect |
| Signing certificates + provisioning profile | Xcode automatic signing on a Mac, or a cloud Mac |
| Archive in Xcode | Product → Archive on a Mac |
| Upload to TestFlight | Organizer → Distribute App |
| External testers | App Store Connect review for the first TestFlight build |

A personal/free Apple ID can run the app on **your** plugged-in iPhone for a week at a time. It cannot ship TestFlight or the App Store.

### Why not a static export

| Approach | Result |
| --- | --- |
| `output: 'export'` + bundle files in the app | Would drop API routes and SSR. Risky rewrite of the live Next app. **Not used.** |
| `server.url` → Vercel | Same UI and backend as the website. Used for this v1 shell. |

Capacitor’s docs mark `server.url` as intended for live reload, not as the long-term production default. Apple can also reject a thin website wrapper (guideline 4.2 Minimum Functionality). v1 accepts that tradeoff so Sai can open Xcode against the real site. A later pass can add native chrome (push, haptics, a local splash) if review requires it.

### Microphone

Browse and the floating assistant call `getUserMedia`. iOS will prompt using `NSMicrophoneUsageDescription` in `ios/App/App/Info.plist`. If the prompt never appears, check Settings → Bandham AI → Microphone.

### Out of scope for this shell

- **Speed Match** (locked Tier 2: 10 questions / 15 seconds) is not a v1 feature. Do not build that flow here.
- **VerifyAI** may appear later as a quiet badge on the existing cards. Do not redesign the site for it.
- Android is not added yet.
- Placeholder icons in `public/icons/` should be replaced before TestFlight.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Capacitor iOS](https://capacitorjs.com/docs/ios) - native project, sync, and Xcode workflow.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The web app is the production surface. Capacitor config and the `ios/` folder are not part of the Vercel build output. Do not add `output: 'export'` to `next.config.ts` for this wrapper.

The easiest way to deploy the Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
