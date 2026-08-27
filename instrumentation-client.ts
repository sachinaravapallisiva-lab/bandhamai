import posthog from "posthog-js";
import { isPostHogEnabled, POSTHOG_DEFAULTS, posthogHost, posthogKey } from "./lib/posthog";

try {
  const key = posthogKey();
  if (isPostHogEnabled() && key) {
    posthog.init(key, {
      api_host: posthogHost(),
      defaults: POSTHOG_DEFAULTS,
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
} catch {
  /* Fail closed. Browse and checkout still work. */
}
