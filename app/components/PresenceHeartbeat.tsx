"use client";

import { useEffect, useRef } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_HEARTBEAT_PATH } from "../../lib/presence";
import { supabase } from "../../lib/supabase";

/** Pings while a signed-in member is using the app (home, chat, account). */
export default function PresenceHeartbeat() {
  const signedInRef = useRef(false);

  useEffect(function () {
    function ping() {
      if (!signedInRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      authJsonHeaders()
        .then(function (headers) {
          if (!headers) return;
          return fetch(PRESENCE_HEARTBEAT_PATH, { method: "POST", headers });
        })
        .catch(function () {
          /* Browse still works if SQL is not applied yet. */
        });
    }

    supabase.auth
      .getSession()
      .then(function (result) {
        signedInRef.current = !!result.data.session;
        ping();
      })
      .catch(function () {
        signedInRef.current = false;
      });

    const { data } = supabase.auth.onAuthStateChange(function (_event, session) {
      signedInRef.current = !!session;
      ping();
    });

    const interval = window.setInterval(ping, PRESENCE_HEARTBEAT_MS);

    function onVisible() {
      if (document.visibilityState === "visible") ping();
    }
    function onFocus() {
      ping();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return function () {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
