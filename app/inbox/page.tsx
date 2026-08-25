"use client";

import { useEffect, useState } from "react";
import { INBOX_KICKER, INBOX_PATH, INBOX_TITLE } from "../../lib/inbox";
import { supabase } from "../../lib/supabase";
import { MUTED } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import InboxList from "../components/InboxList";

export default function InboxPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSignedIn(!!result.data.session);
    });
  }, []);

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 8px" }}>
        {INBOX_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 18px", fontSize: 28, fontWeight: 400 }}>
        {INBOX_TITLE}
      </h2>
      <InboxList signedIn={signedIn} nextPath={INBOX_PATH} />
    </AppChrome>
  );
}
