/** Shared Terms agree lock for Sign up, profile writes, and VerifyAI start. */

export const TERMS_PATH = "/terms";
export const TERMS_PRIVACY_PATH = "/privacy";

export const TERMS_AGREE_LABEL = "I agree to the Terms.";
export const TERMS_NEED = "Agree to the Terms to continue.";
export const TERMS_NEED_PROFILE = "Agree to the Terms to save a profile.";
export const TERMS_NEED_VERIFYAI = "Agree to the Terms to start VerifyAI.";

export const TERMS_PROFILE_DATA_TITLE = "Profile data you submit";
export const TERMS_PROFILE_DATA_BODY =
  "When you create or save a profile, Bandham stores the fields you send: name, gender, city, mother tongue, visa status, education, work, about you, what you want in a match, an Instagram username if you add one, a biodata share choice, and a profile photo. Name, gender, city, and a photo are required. The rest is optional. We use this to review the profile, shortlist people on Browse, and show a live profile to other members. Reviewers see a submitted profile before it is live. Other members see it only after a reviewer sets it live. We do not sell profile lists. Account and profile data stay while the account is open. Safety and review notes may be kept longer if needed to handle abuse. You and the person named on the profile must be 18 or older. If you name a religion or community, we treat that as sensitive. We use it only to host and show your profile. We do not sell it. Do not put an Aadhaar number, passport scan, or other government ID in a profile or photo.";

export const TERMS_VERIFYAI_BIO_TITLE = "VerifyAI and biometrics on Bandham";
export const TERMS_VERIFYAI_BIO_BODY =
  "VerifyAI is optional. It costs $4.99 one time, billed by Stripe Checkout. Paying does not verify the profile. Bandham then hands you to the VerifyAI flow at verifyai.llc. That flow asks for Face ID on your phone. If you refuse Face ID, you do not get a badge. Bandham stores a payment row, a status (unverified, pending, verified, failed, or revoked), and an id from VerifyAI when one is returned. Bandham does not store a face map. A quiet badge appears only after VerifyAI succeeds and we have a stored verified status. It is not a background check, a visa check, or a promise that someone is who they say they are.";

export function termsUserCopy() {
  return [
    TERMS_AGREE_LABEL,
    TERMS_NEED,
    TERMS_NEED_PROFILE,
    TERMS_NEED_VERIFYAI,
    TERMS_PROFILE_DATA_TITLE,
    TERMS_PROFILE_DATA_BODY,
    TERMS_VERIFYAI_BIO_TITLE,
    TERMS_VERIFYAI_BIO_BODY,
  ];
}

export function readAgreedFlag(value: unknown) {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    return key === "true" || key === "1" || key === "yes";
  }
  return false;
}

export function hasAgreedTerms(value: unknown) {
  return readAgreedFlag(value) === true;
}

export function canWriteProfile(agreed: unknown) {
  return hasAgreedTerms(agreed);
}

export function canStartVerifyai(agreed: unknown) {
  return hasAgreedTerms(agreed);
}
