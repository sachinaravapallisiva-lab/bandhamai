/** Account hub drawer: family-safe matrimony nav. Not a dating-app chrome. */

export const ACCOUNT_MENU_OPEN_LABEL = "Open account menu";
export const ACCOUNT_MENU_CLOSE_LABEL = "Close account menu";
export const ACCOUNT_MENU_TITLE = "Account";
export const ACCOUNT_MENU_DIALOG_ID = "account-menu";
export const ACCOUNT_MENU_SIGN_IN = "Sign in";
export const ACCOUNT_MENU_SIGN_OUT = "Sign out";
export const ACCOUNT_MENU_FREE_CHIP = "Free";
export const ACCOUNT_MENU_PAID_CHIP = "Bandham AI";
export const ACCOUNT_MENU_MESSAGES_NOTE = "";
export const ACCOUNT_MENU_UPGRADE = "Subscribe $9.99 a month";

export const ACCOUNT_MENU_ITEMS = [
  { id: "profile", label: "My profile", href: "/profile/new" },
  { id: "preferences", label: "Preferences", hint: "Dealbreakers", href: "/preferences" },
  { id: "browse", label: "Browse / Matches", href: "/" },
  { id: "meetup", label: "Meetup this month", href: "/meetup" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
  { id: "verifyai", label: "VerifyAI", href: "/account#verify" },
  { id: "help", label: "Help / Support", href: "/contact" },
  { id: "call", label: "Call us", href: "/contact#call" },
  { id: "settings", label: "Settings / Account", href: "/account" },
  { id: "block", label: "Block", href: "/account#blocked" },
] as const;

export const ACCOUNT_MENU_BIODATA_ID = "biodata";
export const ACCOUNT_MENU_UPGRADE_HREF = "/chat";

export const PREFERENCES_PATH = "/preferences";
export const PREFERENCES_TITLE = "Preferences";
export const PREFERENCES_KICKER = "DEALBREAKERS";
export const PREFERENCES_BODY =
  "This is the home for match preferences and dealbreakers. Nothing is saved here yet. Speed Match stays on Matches after you mark someone Interested.";
export const PREFERENCES_MATCHES_LABEL = "Open Matches";
