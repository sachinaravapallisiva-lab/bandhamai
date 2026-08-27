"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { isPostHogEnabled } from "../lib/posthog";
import { identifySignedInUser, resetPostHogUser } from "../lib/posthog-browser";
import { supabase } from "../lib/supabase";

function PostHogIdentify() {
  useEffect(function () {
    if (!isPostHogEnabled()) return;

    function applyUser(user: { id?: string; email?: string | null } | null) {
      if (user && user.id) {
        identifySignedInUser(user.id, user.email);
        return;
      }
      resetPostHogUser();
    }

    supabase.auth.getSession().then(function (result) {
      applyUser(result.data.session?.user || null);
    });

    const { data } = supabase.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT") {
        resetPostHogUser();
        return;
      }
      applyUser(session?.user || null);
    });

    return function () {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!isPostHogEnabled()) {
    return children;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
