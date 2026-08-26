export const ADMIN_PATH = "/admin";
export const ADMIN_METRICS_PATH = "/admin/metrics";
export const ADMIN_ME_PATH = "/api/admin/me";
export const ADMIN_METRICS_API_PATH = "/api/admin/metrics";

export const ADMIN_MENU_ITEM = {
  id: "admin",
  label: "Admin",
  href: ADMIN_PATH,
} as const;

export const ADMIN_KICKER = "ADMIN";
export const ADMIN_TITLE = "Admin";
export const ADMIN_LEAD = "Internal tools for Bandham AI. Only admins can open this page.";
export const ADMIN_METRICS_CARD_TITLE = "Metrics";
export const ADMIN_METRICS_CARD_BODY = "Where members are from, and which age groups. Signed in profiles only.";
export const ADMIN_METRICS_CARD_ACTION = "Open Metrics";
export const ADMIN_UNAVAILABLE_TITLE = "This page is not available.";
export const ADMIN_UNAVAILABLE_BODY = "Nothing to show here.";

export function adminUserCopy() {
  return [
    ADMIN_MENU_ITEM.label,
    ADMIN_KICKER,
    ADMIN_TITLE,
    ADMIN_LEAD,
    ADMIN_METRICS_CARD_TITLE,
    ADMIN_METRICS_CARD_BODY,
    ADMIN_METRICS_CARD_ACTION,
    ADMIN_UNAVAILABLE_TITLE,
    ADMIN_UNAVAILABLE_BODY,
  ];
}
