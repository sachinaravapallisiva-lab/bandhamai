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

## Connect socials (Instagram only)

Profile create and account edit can take an optional Instagram username or `instagram.com` profile URL. The app stores a clean handle (for example `ananya`). Linking Instagram is optional. The handle stays hidden until the owner chooses to show it to a specific person.

This is Instagram only. Facebook, LinkedIn, X, TikTok, and other networks are rejected. There is no Instagram OAuth and the app never posts to Instagram. Empty is fine — it is not required to submit a profile. Like and match do not reveal Instagram.

### Visibility

- Public Browse never includes the handle in the list JSON.
- Matches do not show the chip just because someone tapped Interested.
- Owner A, while looking at person B (Browse card, Matches card, or `/chat`), taps **Show my Instagram to them**. Then B can see A’s Instagram chip / link.
- A can tap **Hide Instagram from them** to revoke.
- B never sees A’s handle until that grant exists. The share button does not reveal B’s handle.

### Supabase (Sai)

1. Run [`supabase/instagram.sql`](supabase/instagram.sql) if you have not already. That adds `public.profiles.instagram` (max 30 characters).
2. Run [`supabase/instagram_shares.sql`](supabase/instagram_shares.sql) after merge. That adds `public.instagram_shares` (owner → viewer) with RLS.

Until `instagram.sql` is applied:

- Profile create still works. The handle is omitted.
- Saving Instagram (`PATCH /api/profiles`) returns **503** and asks you to run the file.

Until `instagram_shares.sql` is applied:

- Browse never returns Instagram handles.
- Share / hide returns **503** and asks you to run the file.

### Test steps (two accounts)

Use two signed-in accounts, A and B. Both should have live profiles. A has Instagram saved. B may or may not.

1. Signed-in `/profile/new` and `/account` show **CONNECT SOCIALS / INSTAGRAM** and the line “Optional. Your Instagram stays hidden until you choose to show it to someone.” Leave it blank and submit name / gender / city — the profile still goes pending.
2. As A, enter `@ananya` or `https://instagram.com/ananya` and submit (or **Save Instagram**). After `instagram.sql` is applied, `profiles.instagram` should be `ananya`.
3. Enter a Facebook, LinkedIn, X, or TikTok URL — the form should refuse and the row should not store that URL.
4. Signed out (or as B, before any share): Browse A’s card. There is no Instagram chip and the search JSON for A has no `instagram` handle. Like / match still does not show it.
5. As A, open B’s Browse or Matches card (or `/chat` with B’s user id). Tap **Show my Instagram to them**. As B, reload Browse (or the conversation). B now sees A’s Instagram chip, which opens `https://instagram.com/ananya` in a new tab.
6. As A, tap **Hide Instagram from them**. As B, reload — the chip is gone again.
7. No verified badge and no match % from this field. WhatsApp / presence behavior is unchanged.

## Messaging subscription (Stripe)

Browse, search, Speed Match, and profile create stay **free**. **Sending a message** needs an active **$9.99/month** Stripe subscription. The paywall copy is honest: messaging access only — not a match guarantee. There is no fake checkout, no countdown, and no “most people upgrade” line.

If Stripe env vars are missing, the Chat paywall shows **“Billing is not configured”** and does not crash.

### What the app does

1. `POST /api/stripe/checkout` — signed-in Checkout Session (`mode: subscription`) for `STRIPE_PRICE_ID`.
2. `POST /api/stripe/webhook` — verifies the Stripe signature and upserts `public.subscriptions`.
3. `POST /api/stripe/confirm` — after return from Checkout, re-reads the Session from Stripe (not a fake receipt).
4. `POST /api/stripe/portal` — Stripe Customer Portal for manage / cancel.
5. `GET /api/stripe/entitlement` — whether this account can send.
6. `POST /api/messages` — the only send path; returns **402** without an `active` or `trialing` row.

The home Chat tab and `/chat` both check entitlement before Send. Client inserts into `messages` are also blocked by a trigger in the SQL file (if that table exists).

### Stripe Dashboard (Sai)

1. Create a Product, e.g. **Bandham AI messaging**.
2. Add a recurring **Price: $9.99 / month**. Copy the Price ID (`price_...`). That is the default ship Price.
3. Optional later: a second Price at $5.99/month. Put it in `STRIPE_FOUNDING_PRICE_ID` only when you want a follow-up. Checkout does **not** use it today.
4. Developers → API keys: Secret key + Publishable key (test keys first).
5. Developers → Webhooks → Add endpoint:
   - URL: `https://bandhamai.vercel.app/api/stripe/webhook` (plus the same path on preview URLs if you test there)
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copy the webhook signing secret (`whsec_...`).
6. Settings → Customer portal: turn on cancel / update payment method so “Manage subscription” works.
7. Use a Stripe test card (`4242…`) until you switch to live keys.

Do not put secrets in git. `.env.example` lists names only.

### Vercel env (Sai)

Set these on Production, Preview, and Development:

| Name | Where it comes from |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_ID` | $9.99/month Price ID |

Optional: `NEXT_PUBLIC_SITE_URL=https://bandhamai.vercel.app` so Checkout return URLs stay stable.

Redeploy after saving env vars. Existing Supabase keys stay as they are.

### Supabase SQL (Sai)

In the SQL editor, run [`supabase/subscriptions.sql`](supabase/subscriptions.sql). That creates `public.subscriptions` (RLS: select own row; service role writes) and, if `public.messages` exists, a trigger so an insert cannot skip the paywall.

The app does not invent profile columns for this. Entitlement lives on `subscriptions`.

### Test steps

1. With Stripe env **missing**, open Chat → Send. You should see **Billing is not configured**, not a crash.
2. Sign out → Chat → Send. You should be asked to sign in. Browse still works.
3. After env + SQL + webhook are live: sign in, Chat → **Subscribe $9.99/mo** → Stripe Checkout (test card) → return `/?billing=success`.
4. Stripe Dashboard → Webhooks should show `checkout.session.completed` (and subscription events) succeeding.
5. In Supabase, `subscriptions` should have your `user_id`, `stripe_customer_id`, `status` `active` (or `trialing`).
6. Chat Send (or `POST /api/messages` with a Bearer token) should succeed. A second account without a row should get **402**.
7. **Manage subscription** opens the Stripe Customer Portal. Cancel there; after the webhook, Send should paywall again.
8. Speed Match, Browse search, and `/profile/new` stay usable without a subscription.

Public bucket URLs are convenient, not privacy. Real hide-until-matched access control (authenticated bucket + signed URLs) is a follow-up.

### Test steps

1. Signed-out `/profile/new` still sends you to login. Photo upload without a Bearer token is `401`.
2. Sign in, open `/profile/new`, pick a small photo with **AI enhance** checked. You should see a local preview, a progress bar, then a card preview with the stored URL.
3. Submit without a photo — the button stays disabled and `POST /api/profiles` returns 400. After a real upload, submit name / gender / city / photo. Status stays pending.
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

## VerifyAI ($4.99 + quiet badge)

VerifyAI ([verifyai.llc](https://verifyai.llc)) is the verification layer for Bandham profiles. It is not a second matrimony product in this UI.

Flow:

1. The linked profile must already have a `photo_url`. Checkout and start return **409** without one. Paying still does not set verified.
2. Member pays **$4.99 one-time** via real Stripe Checkout (`mode: payment`, `STRIPE_VERIFYAI_PRICE_ID`). Separate from the $9.99/mo messaging Price.
3. Payment is stored. `verifyai_status` becomes `pending` if it was not already `verified`. **Paying does not show the badge.**
4. The member is sent into the VerifyAI flow (`VERIFYAI_START_URL` hosted link, or `VERIFYAI_API_URL` + `VERIFYAI_API_KEY` session create).
5. VerifyAI calls `POST /api/verifyai/webhook` on success. The badge appears only when `verifyai_status = 'verified'`, a paid $4.99 row exists, **and** the profile has a photo. Operator `POST /api/verifyai` cannot skip payment or the photo.

verifyai.llc does not publish a public API in this repo (biometric link product, contact@verifyai.llc). The start URL / API env is the handoff.

### Supabase

Run [`supabase/verifyai.sql`](supabase/verifyai.sql). Adds profile status columns plus `verifyai_payments` and `verifyai_sessions`.

### Stripe Dashboard (Sai)

On the same Stripe account as messaging:

1. Product e.g. **Bandham AI VerifyAI**.
2. One-time **Price: $4.99**. Copy `price_...` into `STRIPE_VERIFYAI_PRICE_ID`.
3. The existing webhook URL (`/api/stripe/webhook`) also records this payment (`metadata.purpose=verifyai`). No second webhook is required.

Do not point `STRIPE_PRICE_ID` at the $4.99 Price. That env is the $9.99/mo messaging subscription.

### Vercel env (Sai)

In addition to the existing Stripe messaging keys:

| Name | Purpose |
| --- | --- |
| `STRIPE_VERIFYAI_PRICE_ID` | $4.99 one-time Price ID |
| `VERIFYAI_START_URL` | Hosted VerifyAI flow URL (used if no API) |
| `VERIFYAI_API_URL` | Optional session-create endpoint |
| `VERIFYAI_API_KEY` | Optional Bearer for that endpoint |
| `VERIFYAI_WEBHOOK_SECRET` | Shared secret for `/api/verifyai/webhook` |

Do not commit secrets.

### Test steps

1. No SQL / no status → no badge.
2. Profile without `photo_url` → pay / start CTAs stay off; checkout and start return **409**.
3. Pay $4.99 (or confirm a Checkout session) → `verifyai_payments` is `paid`, profile `pending`, **no badge**.
4. Continue to VerifyAI (or set `VERIFYAI_START_URL`). Return without a success webhook → still no badge.
5. Signed webhook with `status=verified` **and** a paid row **and** a photo → quiet VERIFYAI on Browse / Matches.
6. Webhook `verified` without a paid row, or without a photo → **409**, badge stays off.
7. Messaging $9.99/mo checkout is unchanged.

## Online / offline (presence)

Signed-in members who are using the app show a small **green** mark. It is not VerifyAI and not a match %. Seeded sample profiles without a `user_id` stay **Offline**.

### What the app does

1. `POST /api/presence/heartbeat` — auth required; upserts `public.presence.last_seen_at = now()`.
2. Signed-in clients ping that route about every 35 seconds, and again when the tab becomes visible or focused.
3. `GET /api/profiles/search` adds `online: true` when `last_seen_at` is within **3 minutes**.
4. `GET /api/presence?user_id=` — auth required; used by the live `/chat` partner header.
5. Browse cards, Matches cards, and `/chat` show a green circular dot + **Online**, or muted **Offline**.

The home Chat tab is still a layout preview (Priya is not a live person). Presence there is not faked.

### Supabase (Sai)

Run [`supabase/presence.sql`](supabase/presence.sql) in the SQL editor. Until that file is applied, heartbeat returns **503** and every card stays Offline. Browse and Chat still work.

Do not add Stripe or VerifyAI env for this. Existing Supabase keys are enough.

### Test steps (two browsers / two accounts)

1. Apply `supabase/presence.sql`. Confirm `public.presence` exists (RLS on).
2. Browser A: sign in as account A. Open Browse or `/chat` and stay on the tab. In Supabase, `presence` should get a row for A with a fresh `last_seen_at`.
3. Browser B: sign in as account B. Search Browse. If A has a **live** profile, B should see a **green Online** mark on A's card. Seeded cards without `user_id` stay Offline.
4. Close Browser A (or sign A out). After about 3 minutes, refresh Browse in Browser B — A should show muted **Offline**.
5. `/chat` in Browser B: enter account A's user id → partner header should match Online / Offline.
6. Sign out. Heartbeats stop. Quiet VERIFYAI badge (if any) is unchanged.

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

That choice is intentional. The site uses App Router API routes (`/api/transcribe`, `/api/guru`, `/api/chat`, `/api/profiles`, `/api/photos`, `/api/speed-match`, `/api/stripe/*`, `/api/messages`), Supabase, Stripe, and Grok STT. `output: 'export'` would break those and risk the Vercel production deploy. Capacitor still needs a local `webDir` (`ios-shell/`) for the native project and an offline fallback page.

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

## Bandham assistant vs profile search

Two surfaces. They do not share a backend job.

| Surface | What it does | What it never does |
| --- | --- | --- |
| Top search box + **Tap to speak** | Typed or spoken person search: Grok STT → desi/English parse → `/api/profiles/search` | Open the assistant chip, run `/api/guru`, write chat text |
| Bandham assistant (mic chip) | Serious suggestions and guidance: filters, honesty, evaluating fit, profile wording if asked. Can also collect an app issue summary and open a support ticket after confirm (`/api/guru`; leftover `/api/chat` is the same handler). If a stored Gun Milan report exists, it may explain that report only. | Search profiles, invent VerifyAI or a match %, invent Gun Milan scores, write pickup lines or sendable chat, coach parent-conversation scripts, auto-reply, rate the other person, file a ticket from every message |

If someone asks the assistant to find people, it may say “use the search box above.” It must not run a search.

`npm run check:guru-search` and `npm run check:gun-milan` lock the split.

## Gun Milan (Prokerala)

In-app Kundli Gun Milan is matrimony matching, not a horoscope toy. The paid **Prokerala Astrology API** Kundali Matching endpoint does the chart math. Bandham AI only stores the raw report and lets the assistant explain that stored report. The app does not compute gunas and does not call AstroSage. DivineAPI is not in this release.

Profiles already have `dob`. Gun Milan also needs birth time and birth place (lat / lon / time zone) for both people. Those fields live in a private table. They are never on Browse cards.

### How to get Prokerala keys (Sai)

1. Open [Prokerala Astrology API](https://www.prokerala.com/astrology/astrology-api.htm) and create a client at [client-api.prokerala.com](https://client-api.prokerala.com/).
2. Copy **Client ID** and **Client Secret** from the dashboard.
3. The app uses OAuth2 client credentials: `POST https://api.prokerala.com/token`, then `GET https://api.prokerala.com/v2/astrology/kundli-matching/advanced` (Ashtakoot / North, koot table and manglik flags).
4. Do not put these values in git or in any `NEXT_PUBLIC_` name.

### Vercel env (Sai)

Set these on Production, Preview, and Development. Server only.

| Name | Purpose |
| --- | --- |
| `PROKERALA_CLIENT_ID` | Prokerala OAuth client id |
| `PROKERALA_CLIENT_SECRET` | Prokerala OAuth client secret |

If either is missing, Gun Milan **fails closed**. The UI says **Matching is not set up yet.** and the API does not invent a score.

### Supabase SQL (Sai / CoS)

In the SQL editor, run [`supabase/gun_milan.sql`](supabase/gun_milan.sql). That:

1. Adds `public.profiles.kundli_share` (boolean, default false). Other-person Gun Milan stays off until they opt in.
2. Creates `public.profile_birth_details` with RLS: owner read / write only.
3. Creates `public.gun_milan_reports` to cache the raw API JSON for a pair so we do not re-bill on every view.

Until that file is applied, birth details and Gun Milan APIs return **503** and ask you to run it. Browse still works. Do not add religion or caste columns.

### What the app does

1. Account can save birth date, time, place, coordinates, time zone, and the kundli opt-in.
2. Signed in, on a Browse or Matches card: **Gun Milan** only if the other member opted in.
3. Both people must have complete birth details. The first run calls Prokerala and stores the raw report. Later views reuse the cache unless birth details change.
4. The UI shows the API score, koot table, and manglik flags exactly as returned.
5. The Bandham assistant may explain that stored report. With no report, it refuses to guess compatibility.

### Test steps

1. With Prokerala env **missing**, open Gun Milan on an opted-in live card (or Account). You should see **Matching is not set up yet.** No invented score.
2. Apply `supabase/gun_milan.sql`. Confirm `kundli_share`, `profile_birth_details`, and `gun_milan_reports` exist (RLS on).
3. Sign in as A. Account → save birth details. Leave kundli matching off. As B, A’s card has no Gun Milan action.
4. As A, turn on **Allow others to run Gun Milan with me**. As B (with B’s own birth details), A’s card shows Gun Milan.
5. Run Gun Milan once. The panel shows the API score / koot table / manglik flags. A second view should say the stored report was reused.
6. Search JSON for A must not include birth time, place, lat, lon, time zone, or dob.
7. Ask the assistant about Gun Milan before a report exists. It must refuse to invent a score. After a stored report, it may explain that report only. It still must not search profiles or write sendable dating text.
8. `npm run check:gun-milan` and `npm run check:guru-search`.

### Test steps

**Profile search (top box)**

1. On Browse, the box is labeled **PROFILE SEARCH**. Placeholder starts with “Search profiles”.
2. Type `doctor in Hyderabad` and press Search or Enter. Cards come from `/api/profiles/search`. The assistant chip stays closed.
3. Tap **Tap to speak**, say a person search, tap stop. Transcript lands in the same box and searches. The chip still stays closed.
4. Network tab: search path is `/api/transcribe` then `/api/profiles/search`. No `/api/guru` or `/api/chat`.

**Bandham assistant (mic chip)**

1. Open the chip. Intro says it is the Bandham assistant and points at the search box above. Title is **Bandham assistant**, not a person-search prompt.
2. Ask “Find me a doctor in Dallas.” It should tell you to use the search box. Browse cards must not change from this chat.
3. Ask “How do I talk to her in chat?” or for pickup lines. It should refuse scripts and stay on serious guidance.
4. Ask “How do I talk to her parents?” It should refuse a conversation script, not a shortlist.
5. Ask it to write a first message she would think you wrote, or to rate someone, or for a match % / VerifyAI score. It should refuse.
6. Network tab: chip posts `/api/guru` (or leftover `/api/chat`, same handler). No `/api/profiles/search`.
7. Ask to open a ticket about a billing or app bug, give a short summary, then tap **Open ticket**. A row should land in `support_tickets`. Ordinary coaching must not create a row.

### Microphone

Browse search and the Bandham assistant both call `getUserMedia`. iOS will prompt using `NSMicrophoneUsageDescription` in `ios/App/App/Info.plist`. If the prompt never appears, check Settings → Bandham AI → Microphone.

### Out of scope for this shell

- **Speed Match** is live from Matches after Like: 10 Indian / desi matrimony dealbreaker questions, 15 seconds each. It is not a swipe deck and does not invent a match score. Persist needs [`supabase/speed_match.sql`](supabase/speed_match.sql).
- **VerifyAI** is a quiet badge on existing cards when `verifyai_status` is verified. Do not redesign the site for it.
- Android is not added yet.
- Placeholder icons in `public/icons/` should be replaced before TestFlight.

## Support tickets (assistant)

The Bandham assistant can file an in-app ticket for **app issues** (bug, billing, account, other). This is separate from Block / Report / delete account. Harassment still uses Block and Report. Tickets are not an emergency service.

The guru never writes the row itself. It proposes a draft (`propose_support_ticket` or a clear support intent). The orb shows a confirm chip. Only **Open ticket** calls `POST /api/support/tickets`.

### What the app does

1. `POST /api/support/tickets` — auth required. Inserts `public.support_tickets` (own `user_id`, optional account email, category, subject, body, `status=open`, `source=assistant`).
2. Then emails the founder with Resend. If `RESEND_API_KEY` is missing or Resend errors, the ticket still stays saved and the error is logged.
3. The member sees a ticket id and a short “we will look into it” note, plus the app-issue / Block-Report disclaimer.

There is no admin UI in this pass. Review the queue in the Supabase table editor.

### Supabase (Sai)

Run [`supabase/support_tickets.sql`](supabase/support_tickets.sql) in the SQL editor. Until that file is applied, the API returns **503** and asks you to run it. Browse, search, and coaching still work.

Do not run Instagram SQL from this file. Instagram columns stay as they are.

### Vercel env (Sai)

Set these on Production, Preview, and Development:

| Name | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. Ticket rows still save if this is missing. |
| `SUPPORT_INBOX_EMAIL` | Founder inbox. Default in code is `sachin.aravapallisiva@gmail.com`. |
| `RESEND_FROM_EMAIL` | Optional. Defaults to Resend's onboarding sender until you verify a Bandham domain. |

Do not commit secrets. Redeploy after saving env vars.

### Test steps

1. Apply `supabase/support_tickets.sql`. Confirm `public.support_tickets` exists (RLS on).
2. Signed out: open the Bandham assistant, ask to open a ticket about “billing charged me twice”, give a summary. Confirm chip should offer **Sign in to open a ticket**. No row yet.
3. Sign in. Repeat. Tap **Open ticket**. A row appears with your `user_id`, category `billing`, `status` `open`, `source` `assistant`. The chip shows a ticket id.
4. If `RESEND_API_KEY` is set, Sai’s inbox (`SUPPORT_INBOX_EMAIL`) should get the notify. If the key is missing, the row still exists and the server log mentions the skip.
5. Ask for profile wording or “find me a doctor”. No ticket row. Browse search is unchanged.
6. Ask to report a person / harassment. The assistant should point to Block and Report, not open this ticket.
7. `npm run check:support-tickets` and `npm run check:guru-search`.

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
