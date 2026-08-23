import { readFileSync } from "node:fs";
import {
  PROFILE_PHOTO_REQUIRED_ERROR,
  hasProfilePhotoUrl,
  isOwnStoredPhotoUrl,
} from "../lib/profile-photos.ts";
import { VERIFYAI_COPY } from "../lib/verifyai.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(PROFILE_PHOTO_REQUIRED_ERROR === "Add a profile photo before you submit.", "submit error copy");
assert(VERIFYAI_COPY.photoRequired === "Add a profile photo before VerifyAI.", "VerifyAI error copy");

assert(hasProfilePhotoUrl("https://example.supabase.co/storage/v1/object/public/profile-photos/u1/a.webp") === true, "non-empty url counts");
assert(hasProfilePhotoUrl("   ") === false, "whitespace is not a photo");
assert(hasProfilePhotoUrl("") === false, "empty is not a photo");
assert(hasProfilePhotoUrl(null) === false, "null is not a photo");
assert(hasProfilePhotoUrl(undefined) === false, "undefined is not a photo");

const own = "https://xyz.supabase.co/storage/v1/object/public/profile-photos/user-123/abc.webp";
assert(isOwnStoredPhotoUrl(own, "user-123") === true, "own stored url accepted");
assert(isOwnStoredPhotoUrl(own, "other-user") === false, "other user url rejected");
assert(isOwnStoredPhotoUrl("https://example.com/face.jpg", "user-123") === false, "off-bucket url rejected");
assert(isOwnStoredPhotoUrl("", "user-123") === false, "empty url rejected");

const profiles = read("app/api/profiles/route.ts");
assert(profiles.includes("isOwnStoredPhotoUrl"), "POST /api/profiles uses isOwnStoredPhotoUrl");
assert(profiles.includes("PROFILE_PHOTO_REQUIRED_ERROR"), "POST /api/profiles rejects missing photo");
assert(profiles.includes("status: 400"), "missing photo is 400");
assert(profiles.includes('status: "pending"'), "successful submit stays pending");

const form = read("app/profile/new/page.tsx");
assert(form.includes("PROFILE_PHOTO_REQUIRED_ERROR"), "create form shows required photo error");
assert(form.includes("!photos.photo_url"), "create form disables submit without a photo");
assert(form.includes("required"), "create form marks photo required");

const upload = read("app/components/PhotoUpload.tsx");
assert(upload.includes("required"), "PhotoUpload can mark photo required");
assert(upload.includes("Required."), "PhotoUpload required chrome");

const start = read("app/api/verifyai/start/route.ts");
assert(start.includes("hasPhoto") || start.includes("photoRequired"), "start gates on photo");
assert(start.includes("409") || start.includes("400"), "start photo reject is 400/409");
assert(start.includes("verifyaiPhotoRequiredBody") || start.includes("VERIFYAI_COPY.photoRequired"), "start returns photo required error");

const checkout = read("app/api/verifyai/checkout/route.ts");
assert(checkout.includes("hasPhoto") || checkout.includes("photoRequired"), "checkout gates on photo");
assert(checkout.includes("verifyaiPhotoRequiredBody") || checkout.includes("VERIFYAI_COPY.photoRequired"), "checkout returns photo required error");
assert(!checkout.includes('verifyai_status: "verified"'), "checkout does not set verified");

const confirm = read("app/api/verifyai/confirm/route.ts");
assert(!confirm.includes('verifyai_status: "verified"'), "confirm does not set verified");
assert(confirm.includes("photoRequired") || confirm.includes("hasPhoto"), "confirm does not start VerifyAI without a photo");

const webhook = read("app/api/verifyai/webhook/route.ts");
assert(webhook.includes("profileHasRequiredPhoto"), "webhook fail-closes verified without photo");
assert(webhook.includes("verifyaiPhotoRequiredBody") || webhook.includes("photoRequired"), "webhook photo error");

const operator = read("app/api/verifyai/route.ts");
assert(operator.includes("profileHasRequiredPhoto"), "operator fail-closes verified without photo");

const marker = read("lib/verifyai-checkout.ts");
assert(marker.includes("profileHasRequiredPhoto"), "shared photo lookup");
assert(marker.includes("isVerifyaiVerified(input.status)"), "mark verified fail-closes without photo");

const offer = read("app/components/VerifyOffer.tsx");
assert(offer.includes("hasPhoto"), "VerifyOffer reads photo state");
assert(offer.includes("/profile/new"), "VerifyOffer links to profile photo");
assert(offer.includes("VERIFYAI_COPY.photoRequired") || offer.includes("photoRequired"), "VerifyOffer explains photo required");

console.log("photo required gates ok");
