"use client";

import { useEffect, useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import {
  INSTAGRAM_SHARE_PATH,
  cleanInstagramHandle,
} from "../../lib/instagram-shares";
import { LINE, MUTED, VIOLET } from "../../lib/theme";
import InstagramChip from "./InstagramChip";

type ShareState = {
  canShare: boolean;
  shared: boolean;
  instagram: string;
};

export default function InstagramShareControls({
  profileId,
  userId,
  signedIn,
  initialHandle,
}: {
  profileId?: string;
  userId?: string;
  signedIn: boolean;
  initialHandle?: string | null;
}) {
  const peerProfile = typeof profileId === "string" ? profileId.trim() : "";
  const peerUser = typeof userId === "string" ? userId.trim() : "";
  const [state, setState] = useState<ShareState>({
    canShare: false,
    shared: false,
    instagram: cleanInstagramHandle(initialHandle),
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(
    function () {
      if (!signedIn || (!peerProfile && !peerUser)) return;
      let cancelled = false;

      authJsonHeaders()
        .then(function (headers) {
          if (!headers) return null;
          const params = peerProfile
            ? "profile_id=" + encodeURIComponent(peerProfile)
            : "user_id=" + encodeURIComponent(peerUser);
          return fetch(INSTAGRAM_SHARE_PATH + "?" + params, { headers }).then(function (r) {
            return r.json().then(function (data) {
              return { ok: r.ok, status: r.status, data };
            });
          });
        })
        .then(function (result) {
          if (cancelled || !result) return;
          if (!result.ok) {
            if (result.status === 503 || result.status === 401) return;
            return;
          }
          setState({
            canShare: !!result.data.canShare,
            shared: !!result.data.shared,
            instagram: cleanInstagramHandle(result.data.instagram) || cleanInstagramHandle(initialHandle),
          });
        })
        .catch(function () {
          /* keep the card usable */
        });

      return function () {
        cancelled = true;
      };
    },
    [signedIn, peerProfile, peerUser, initialHandle]
  );

  function sendShare(method: "POST" | "DELETE") {
    if (!signedIn || busy || (!peerProfile && !peerUser)) return;
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNote("Sign in to continue.");
          return null;
        }
        return fetch(INSTAGRAM_SHARE_PATH, {
          method,
          headers,
          body: JSON.stringify({
            profile_id: peerProfile || null,
            user_id: peerUser || null,
          }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setBusy(false);
          if (!res.ok) {
            setNote((typeof data.error === "string" && data.error) || "Could not update Instagram sharing.");
            return;
          }
          setState(function (prev) {
            return { ...prev, shared: method === "POST" };
          });
        });
      })
      .catch(function () {
        setBusy(false);
        setNote("Could not update Instagram sharing.");
      });
  }

  const handle = state.instagram;
  const showShare = signedIn && state.canShare && (peerProfile || peerUser);

  if (!handle && !showShare) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {handle ? <InstagramChip handle={handle} /> : null}
      {showShare ? (
        <div>
          <button
            type="button"
            onClick={function () {
              sendShare(state.shared ? "DELETE" : "POST");
            }}
            disabled={busy}
            className="bm-sans bm-ghost bm-focus"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: handle ? 8 : 0,
              background: "transparent",
              color: VIOLET,
              border: "1px solid " + LINE,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {state.shared ? "Hide Instagram from them" : "Show my Instagram to them"}
          </button>
          {note ? (
            <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 12, color: MUTED }}>
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
