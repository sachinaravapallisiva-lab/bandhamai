import posthog from "posthog-js";
import { identifyPersonProperties, isPostHogEnabled } from "./posthog";

export function identifySignedInUser(userId: string, email?: string | null) {
  if (!isPostHogEnabled() || !userId) return;
  posthog.identify(userId, identifyPersonProperties(email));
}

export function resetPostHogUser() {
  if (!isPostHogEnabled()) return;
  posthog.reset();
}

export function capturePostHogEvent(event: string) {
  if (!isPostHogEnabled() || !event) return;
  posthog.capture(event);
}
