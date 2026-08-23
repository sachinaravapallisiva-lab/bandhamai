"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { MUTED } from "../../lib/theme";
import AppChrome from "../components/AppChrome";

/** Clears the Supabase session. This is a real sign-out, not a 404. */
export default function LogoutPage() {
  const [note, setNote] = useState("Signing out…");

  useEffect(function () {
    supabase.auth
      .signOut()
      .then(function () {
        window.location.replace("/");
      })
      .catch(function () {
        setNote("Could not sign out. Open Account and try again.");
      });
  }, []);

  return (
    <AppChrome>
      <p className="bm-sans" style={{ color: MUTED, fontSize: 14 }}>
        {note}
      </p>
    </AppChrome>
  );
}
