export const LEGAL_UPDATED = "26 August 2026";

/** Production host for canonical URLs, sitemap, and robots. */
export const SITE_ORIGIN = "https://bandhamai.vercel.app";

export const FOOTER_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/safety", label: "Safety" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/idea", label: "Send a feature idea" },
  { href: "/account", label: "Account" },
] as const;

/** Live Bandham Support voice line. Do not invent another number. Spaces only. */
export const SUPPORT_CALL_PATH = "/contact#call";
export const SUPPORT_CALL_LABEL = "Call us";
export const SUPPORT_CALL_HEADLINE = "Call us";
export const SUPPORT_PHONE_DISPLAY = "+1 803 265 5233";
export const SUPPORT_PHONE_TEL = "tel:+18032655233";
export const SUPPORT_CALL_BODY =
  "This is Bandham Support for accounts, billing, and tickets. Not the love guru. Not an emergency line.";

/** Guest contact: call or sign in. Do not invent a public support inbox. */
export const CONTACT_GUEST_HINT = "Call us, or sign in to open a ticket.";
export const CONTACT_SIGNED_HINT = "Signed in notes become a support ticket. We will look into it.";
export const CONTACT_TICKET_SAVED = "Ticket saved. We will look into it.";
export const CONTACT_TICKET_EMAILED = "Ticket saved. A notice was emailed. We will look into it.";
export const CONTACT_TICKET_NEED_DETAIL = "Add a short subject and a note of at least a few words.";
export const CONTACT_TICKET_FAILED = "Could not save the ticket. Try again or call us.";
export const CONTACT_OPEN_TICKET = "Open ticket";
export const CONTACT_SIGN_IN = "Sign in";
export const CONTACT_DANGER =
  "If someone is in immediate danger, contact local authorities. It is not an emergency service.";

export function contactUserCopy() {
  return [
    SUPPORT_CALL_LABEL,
    SUPPORT_CALL_HEADLINE,
    SUPPORT_CALL_BODY,
    SUPPORT_PHONE_DISPLAY,
    CONTACT_GUEST_HINT,
    CONTACT_SIGNED_HINT,
    CONTACT_TICKET_SAVED,
    CONTACT_TICKET_EMAILED,
    CONTACT_TICKET_NEED_DETAIL,
    CONTACT_TICKET_FAILED,
    CONTACT_OPEN_TICKET,
    CONTACT_SIGN_IN,
    CONTACT_DANGER,
  ];
}
