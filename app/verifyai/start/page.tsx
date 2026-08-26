"use client";

import { useEffect, useState } from "react";
import AppChrome, { ChromeLink } from "../../components/AppChrome";
import VerifyOffer from "../../components/VerifyOffer";
import { supabase } from "../../../lib/supabase";

export default function VerifyaiStartPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSignedIn(!!result.data.session);
    });
  }, []);

  return (
    <AppChrome right={<ChromeLink href="/account">Account</ChromeLink>}>
      <VerifyOffer signedIn={signedIn} nextPath="/account" />
    </AppChrome>
  );
}
