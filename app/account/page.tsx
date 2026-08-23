"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { authJsonHeaders } from "../../lib/client-auth";
import { DELETE_CONFIRM_WORD } from "../../lib/safety";
import {
  BIODATA_SHARE_SAVE_LABEL,
  BIODATA_SHARE_SAVING_LABEL,
  parseBiodataShare,
} from "../../lib/biodata-share";
import { parseInstagramInput } from "../../lib/instagram";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import BiodataShareField from "../components/BiodataShareField";
import DownloadBiodata from "../components/DownloadBiodata";
import InstagramField from "../components/InstagramField";
import VerifyOffer from "../components/VerifyOffer";

type BlockRow = {
  id: string;
  blocked_profile_id: string | null;
  blocked_user_id: string | null;
  created_at: string;
};

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [blocks, setBlocks] = useState<BlockRow[] | null>(null);
  const [blocksNote, setBlocksNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [instagram, setInstagram] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialNote, setSocialNote] = useState("");
  const [biodataShare, setBiodataShare] = useState(false);
  const [savingShare, setSavingShare] = useState(false);
  const [shareNote, setShareNote] = useState("");

  function loadProfile() {
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch("/api/profiles", { headers })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          const handle =
            data && data.profile && typeof data.profile.instagram === "string"
              ? data.profile.instagram
              : "";
          setInstagram(handle);
          setHasProfile(!!(data && data.profile && data.profile.id));
          setBiodataShare(parseBiodataShare(data && data.profile && data.profile.biodata_share));
        })
        .catch(function () {
          /* account page still works without Instagram */
        });
    });
  }

  function loadBlocks() {
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch("/api/blocks", { headers })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setBlocks([]);
            setBlocksNote(result.data.error || "Could not load blocks.");
            return;
          }
          setBlocks(Array.isArray(result.data.blocks) ? result.data.blocks : []);
          setBlocksNote("");
        })
        .catch(function () {
          setBlocks([]);
          setBlocksNote("Could not load blocks.");
        });
    });
  }

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (!session) {
        setSignedIn(false);
        setReady(true);
        return;
      }
      setSignedIn(true);
      setEmail(session.user.email || "");
      setReady(true);
      loadBlocks();
      loadProfile();
    });
  }, []);

  function signOut() {
    setBusy(true);
    supabase.auth.signOut().then(function () {
      window.location.replace("/");
    }).catch(function () {
      setBusy(false);
      setNote("Could not sign out. Try again.");
    });
  }

  function unblock(row: BlockRow) {
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch("/api/blocks", {
        method: "DELETE",
        headers: headers,
        body: JSON.stringify({ id: row.id }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setBlocksNote(result.data.error || "Could not unblock.");
            return;
          }
          setBlocks(function (prev) {
            return (prev || []).filter(function (item) {
              return item.id !== row.id;
            });
          });
        })
        .catch(function () {
          setBlocksNote("Could not unblock.");
        });
    });
  }

  function saveInstagram() {
    const parsed = parseInstagramInput(instagram);
    if (parsed.error) {
      setSocialNote(parsed.error);
      return;
    }
    if (!hasProfile) {
      setSocialNote("Create a profile first.");
      return;
    }

    setSavingSocial(true);
    setSocialNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setSavingSocial(false);
          setSocialNote("Sign in to save Instagram.");
          return null;
        }
        return fetch("/api/profiles", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ instagram }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setSavingSocial(false);
          if (!res.ok) {
            setSocialNote(data.error || "Could not save Instagram.");
            return;
          }
          const handle = data.profile?.instagram || parsed.handle || "";
          setInstagram(handle);
          setSocialNote(handle ? "Instagram saved." : "Instagram removed.");
        });
      })
      .catch(function () {
        setSavingSocial(false);
        setSocialNote("Network trouble. Try again?");
      });
  }

  function saveBiodataShare() {
    if (!hasProfile) {
      setShareNote("Create a profile first.");
      return;
    }

    setSavingShare(true);
    setShareNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setSavingShare(false);
          setShareNote("Sign in to save this choice.");
          return null;
        }
        return fetch("/api/profiles", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ biodata_share: biodataShare }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setSavingShare(false);
          if (!res.ok) {
            setShareNote(data.error || "Could not save this choice.");
            return;
          }
          const next = parseBiodataShare(data.profile?.biodata_share);
          setBiodataShare(next);
          setShareNote(next ? "Others can download your biodata." : "Others cannot download your biodata.");
        });
      })
      .catch(function () {
        setSavingShare(false);
        setShareNote("Network trouble. Try again?");
      });
  }

  function deleteAccount() {
    if (confirm !== DELETE_CONFIRM_WORD) {
      setNote("Type " + DELETE_CONFIRM_WORD + " to confirm.");
      return;
    }
    setBusy(true);
    setNote("Deleting…");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNote("Sign in to delete your account.");
          return null;
        }
        return fetch("/api/account", {
          method: "DELETE",
          headers: headers,
          body: JSON.stringify({ confirm: DELETE_CONFIRM_WORD }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          return { ok: res.ok, data };
        });
      })
      .then(function (result) {
        if (!result) return;
        if (!result.ok) {
          setBusy(false);
          setNote(result.data.error || "Could not delete the account.");
          return;
        }
        setNote(result.data.message || "Account deletion recorded.");
        supabase.auth.signOut().finally(function () {
          window.setTimeout(function () {
            window.location.replace("/");
          }, 1200);
        });
      })
      .catch(function () {
        setBusy(false);
        setNote("Could not reach account deletion. Try again.");
      });
  }

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        ACCOUNT
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        Account
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
        Sign out, see who you blocked, or delete this account.
      </p>

      {!ready ? (
        <p className="bm-sans" style={{ color: MUTED }}>One moment…</p>
      ) : !signedIn ? (
        <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "28px 18px" }}>
          <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 14, color: MUTED }}>
            Sign in to manage this account.
          </p>
          <Link
            href="/login?next=/account"
            className="bm-sans bm-talk bm-focus"
            style={{
              display: "inline-block",
              background: VIOLET,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "11px 18px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to login
          </Link>
        </section>
      ) : (
        <>
          <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
            <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
              SIGNED IN
            </p>
            <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 15, color: INK }}>
              {email || "Signed in"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                href="/profile/new"
                className="bm-sans bm-ghost bm-focus"
                style={{
                  background: "transparent",
                  color: VIOLET,
                  border: "1px solid " + LINE,
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Your profile
              </Link>
              <DownloadBiodata hasProfile={hasProfile} />
              <button
                type="button"
                disabled={busy}
                onClick={signOut}
                className="bm-sans bm-ghost bm-focus"
                style={{
                  background: "transparent",
                  color: VIOLET,
                  border: "1px solid " + LINE,
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                }}
              >
                Sign out
              </button>
            </div>
          </section>

          <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
            <InstagramField
              id="account-instagram"
              value={instagram}
              onChange={function (value) {
                setInstagram(value);
                if (socialNote) setSocialNote("");
              }}
              disabled={savingSocial || !hasProfile}
            />
            <button
              type="button"
              disabled={savingSocial || !hasProfile}
              onClick={saveInstagram}
              className="bm-sans bm-talk bm-focus"
              style={{
                marginTop: 12,
                background: savingSocial ? VIOLET_DEEP : VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "11px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: savingSocial || !hasProfile ? "default" : "pointer",
              }}
            >
              {savingSocial ? "Saving…" : "Save Instagram"}
            </button>
            {!hasProfile || socialNote ? (
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
                {hasProfile
                  ? socialNote
                  : "Create a profile first. Instagram is optional and stays hidden until you show it to someone."}
              </p>
            ) : null}
          </section>

          <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
            <BiodataShareField
              id="account-biodata-share"
              checked={biodataShare}
              onChange={function (next) {
                setBiodataShare(next);
                if (shareNote) setShareNote("");
              }}
              disabled={savingShare || !hasProfile}
            />
            <button
              type="button"
              disabled={savingShare || !hasProfile}
              onClick={saveBiodataShare}
              className="bm-sans bm-talk bm-focus"
              style={{
                marginTop: 12,
                background: savingShare ? VIOLET_DEEP : VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "11px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: savingShare || !hasProfile ? "default" : "pointer",
              }}
            >
              {savingShare ? BIODATA_SHARE_SAVING_LABEL : BIODATA_SHARE_SAVE_LABEL}
            </button>
            {!hasProfile || shareNote ? (
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
                {hasProfile ? shareNote : "Create a profile first. This stays off until you turn it on."}
              </p>
            ) : null}
          </section>

          <VerifyOffer signedIn={signedIn} nextPath="/account" />

          <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
            <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400 }}>
              Blocked
            </h3>
            {blocks == null ? (
              <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>Loading…</p>
            ) : blocks.length === 0 ? (
              <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
                {blocksNote || "No one blocked yet. Block is on Browse cards, Matches, and live chat."}
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {blocks.map(function (row) {
                  return (
                    <div key={row.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <span className="bm-sans" style={{ fontSize: 13.5, color: INK }}>
                        {row.blocked_profile_id || row.blocked_user_id}
                      </span>
                      <button
                        type="button"
                        onClick={function () {
                          unblock(row);
                        }}
                        className="bm-sans bm-focus"
                        style={{
                          background: "none",
                          border: "none",
                          color: VIOLET,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {blocksNote && blocks && blocks.length > 0 ? (
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: VIOLET_DEEP }}>{blocksNote}</p>
            ) : null}
          </section>

          <section className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}>
            <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400 }}>
              Delete account
            </h3>
            <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              This tries to remove your login and hide your profile from Browse. Safety reports already filed may be kept if a case is still open. Type {DELETE_CONFIRM_WORD} to confirm.
            </p>
            <input
              value={confirm}
              onChange={function (e) {
                setConfirm(e.target.value);
              }}
              placeholder={DELETE_CONFIRM_WORD}
              className="bm-sans bm-input bm-focus"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid " + LINE,
                borderRadius: 10,
                fontSize: 14,
                color: INK,
                background: WASH,
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={deleteAccount}
              className="bm-sans bm-talk bm-focus"
              style={{
                background: VIOLET_DEEP,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "11px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              Delete this account
            </button>
            {note ? (
              <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
                {note}
              </p>
            ) : null}
          </section>
        </>
      )}
    </AppChrome>
  );
}
