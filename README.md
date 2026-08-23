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

## Profile photos

`/profile/new` can upload a profile photo. **AI enhance means a clarity / resolution pass only** — not makeup, not face morphing, not a beauty API.

### How enhance works

`POST /api/photos` (auth required, same Bearer pattern as `/api/profiles`) accepts a JPEG/PNG/WebP/AVIF and runs [sharp](https://sharp.pixelplumbing.com/) on the Node.js runtime:

1. Honor EXIF orientation.
2. If enhance is on (default): Lanczos resize so the longest side is 1600px (small photos are upscaled; large ones are downscaled), then a mild unsharp. If enhance is off: fit inside 1600px without enlarging, no extra sharpen.
3. Write a normalized WebP.
4. Also write a **stored** blur derivative (about 24px + heavy Gaussian blur). CSS blur is not enough for blur-until-matched.

No third-party face/beauty APIs. No new secrets — Storage uses the existing `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` pair.

### Storage setup (Sai)

1. In the Supabase SQL editor, run [`supabase/profile_photos.sql`](supabase/profile_photos.sql). That:
   - ensures `profiles.photo_url` exists
   - adds `profiles.photo_blurred_url` if missing
   - creates a **public** bucket named `profile-photos` (10 MB, image MIME types)
2. Confirm Vercel already has `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not add other photo secrets.
3. Optional, from the earlier profile PR: add `profiles.user_id` so an already-submitted row can receive photo URLs on a later upload. Without `user_id`, the create form still sends the URLs on first insert if the photo columns exist.

If the bucket is missing, the API returns **503** and asks you to run that SQL (or create a bucket named `profile-photos`). The app does not invent extra database columns at runtime — it probes with the same `tableHasColumn` helper as `user_id`.

Public bucket URLs are convenient, not privacy. Real hide-until-matched access control (authenticated bucket + signed URLs) is a follow-up.

### Test steps

1. Signed-out `/profile/new` still sends you to login. Photo upload without a Bearer token is `401`.
2. Sign in, open `/profile/new`, pick a small photo with **AI enhance** checked. You should see a local preview, a progress bar, then a card preview with the stored URL.
3. Submit name / gender / city. The success screen should show the photo when a URL is present.
4. In Supabase Storage → `profile-photos` you should see `{user-id}/{uuid}.webp` and `{uuid}-blur.webp`.
5. If you ran the SQL, the `profiles` row should have `photo_url` and `photo_blurred_url`. If those columns are absent, files still land in Storage and the UI still previews the returned URLs.
6. A missing bucket should show a clear “run supabase/profile_photos.sql” error, not a blank failure.

## Block, report, and delete account

In-app **Block** and **Report** sit on Browse cards, Matches cards, and live `/chat`. They are not Contact-only. **Delete account** is on `/account` (also linked from the footer and the signed-in header).

### Supabase (Sai)

Run [`supabase/safety.sql`](supabase/safety.sql) in the SQL editor. That creates `blocks`, `reports`, and `account_deletion_requests`, plus an optional insert policy on `messages` if that table already exists.

Until that SQL is applied, the APIs return **503** and ask you to run the file. Browse still works.

### What the tools do

- **Block** — hides that profile on the viewer's Browse list and should stop messaging both ways (app check + SQL if `messages` exists). Unblock is on `/account`.
- **Report** — writes a reviewable row (`reason`, `details`, `surface`). It does not call the police and does not promise a response time.
- **Delete account** — asks you to type `DELETE`. Hides the profile (`status = removed`) and tries `auth.admin.deleteUser`. If the login cannot be removed, a deletion request stays for an operator. Sign-out still clears the session.

Immediate danger stays with local authorities. The product is not an emergency service.

### Test steps

1. Signed out → Block / Report on a card asks you to sign in (`/login?next=/` or `/matches`).
2. After `safety.sql`: sign in → Block a live card → it leaves your shortlist. Search again — that profile is gone for you. The other person should not see you either.
3. Report the same (or another) card → a row in `reports`. Copy says we will look at it, and to call local authorities if someone is in danger.
4. `/chat` with a recipient id → Block / Report under the recipient field. Send after a block should refuse.
5. `/account` → Sign out actually returns you to Browse signed out (also `/logout`, which is not a 404).
6. `/account` → type `DELETE` → profile hidden; login removed when the service role can. If login removal fails, the page says a request was recorded.

## VerifyAI (quiet badge)

VerifyAI ([verifyai.llc](https://verifyai.llc)) is the verification layer for Bandham profiles. It is not a second matrimony product in this UI.

This repo does not contain a public VerifyAI API. `verifyai.llc` is a biometric-link product (contact@verifyai.llc). The app stores status on the Bandham profile and shows a quiet **VERIFYAI** badge **only** when `profiles.verifyai_status = 'verified'`. Pending, failed, revoked, missing, or invented values stay hidden.

### Supabase

Run [`supabase/verifyai.sql`](supabase/verifyai.sql). Adds `verifyai_status`, `verifyai_external_id`, and `verifyai_updated_at` on `profiles`.

### Wiring the live service

1. Run the SQL.
2. On Vercel, set `VERIFYAI_WEBHOOK_SECRET` (do not commit it). Redeploy.
3. Point VerifyAI at `POST https://bandhamai.vercel.app/api/verifyai/webhook`.
   - `Authorization: Bearer <VERIFYAI_WEBHOOK_SECRET>`, or
   - `X-VerifyAI-Signature` = hex HMAC-SHA256 of the raw body (optional `X-VerifyAI-Timestamp`).
4. JSON body (or `{ "data": { ... } }`) should include a status and one of `profile_id`, `user_id`, or `email`.
   - Status values: `unverified` | `pending` | `verified` | `failed` | `revoked`
   - Also accepted: `completed` / `success` → `verified`; `fail` → `failed`
5. Operators can `POST /api/verifyai` with the same Bearer secret to set a status by hand while the service is wired. Members cannot self-verify.
6. `GET /api/verifyai?profile_id=` returns `{ verified, status }`. `verified` is true only for `verified`.

Do not mark a row `verified` unless VerifyAI actually passed.

### Test steps

1. No column / no SQL → Browse cards have no badge.
2. After SQL, a live profile with `verifyai_status` null or `pending` → no badge.
3. Set one live row to `verified` (SQL editor or signed webhook) → quiet VERIFYAI label next to the name on Browse and Matches.
4. Webhook without the secret → **401** or **503**. No status change.

## Auth polish

Login already used `?next=`. It now allowlists internal paths only (`/`, `/matches`, `/chat`, `/profile/new`, `/account`, legal pages, `/logout`). `//evil.com` and unknown paths fall back to `/`.

`/matches` exists so `/login?next=/matches` does not 404.

### Forgot password

On `/login`, enter an email and tap **Forgot password**. That calls Supabase `resetPasswordForEmail` and returns to `/login?mode=reset`. After the email link, the page asks for a new password (`updateUser`).

In Supabase → Authentication → URL configuration, allow:

- `https://bandhamai.vercel.app/login`
- `https://bandhamai.vercel.app/**`
- local `http://localhost:3000/login` for dev

### Email confirmation

This app does **not** turn Confirm email on or off. That is the Supabase project toggle (Authentication → Providers → Email → Confirm email).

- If confirm is **off** (typical for the live smoke test): signup returns a session and continues. Leave that alone.
- If confirm is **on**: signup returns no session and the existing “check your email” copy still shows. **Resend confirmation** is optional and does not change the signup call.

### Sign out

`/logout` and Account → Sign out call `supabase.auth.signOut()` and send you home. There is no fake 404 logout.

### Test steps

1. `/login?next=/matches` → after sign-in, Matches tab (not a 404, not an external site).
2. `/login?next=https://example.com` and `/login?next=//evil.com` → home.
3. Forgot password with your email → reset mail (after redirect URLs are set) → new password works.
4. Signup still works the way it does today (session if confirm is off).
5. Sign out from the header or `/logout` → Browse shows Sign in.

## iOS app (Capacitor)

The iOS target is a Capacitor wrapper around the **hosted** Next.js app. It loads `https://bandhamai.vercel.app` in a WKWebView so the iPhone app matches the website without a static-export rewrite.

That choice is intentional. The site uses App Router API routes (`/api/transcribe`, `/api/chat`, `/api/profiles`, `/api/photos`, `/api/speed-match`), Supabase, and Grok STT. `output: 'export'` would break those and risk the Vercel production deploy. Capacitor still needs a local `webDir` (`ios-shell/`) for the native project and an offline fallback page.

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

- **Speed Match** is live from Matches after Like: 10 Indian / desi matrimony dealbreaker questions, 15 seconds each. It is not a swipe deck and does not invent a match score. Persist needs [`supabase/speed_match.sql`](supabase/speed_match.sql).
- **VerifyAI** is a quiet badge on existing cards when `verifyai_status` is verified. Do not redesign the site for it.
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
