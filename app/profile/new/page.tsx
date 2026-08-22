"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { authJsonHeaders } from "../../../lib/client-auth";
import {
  emptyProfileForm,
  PROFILE_FORM_FIELDS,
  REQUIRED_PROFILE_FIELDS,
  type ProfileWritePayload,
} from "../../../lib/profile-fields";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../../lib/theme";
import AppChrome, { ChromeLink } from "../../components/AppChrome";

type Mine = {
  profile: { id?: string; status?: string } | null;
  linked: boolean;
} | null;

export default function NewProfilePage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [form, setForm] = useState<ProfileWritePayload>(() => emptyProfileForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [mine, setMine] = useState<Mine>(null);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (!session) {
        setSignedIn(false);
        setReady(true);
        return;
      }
      setSignedIn(true);
      authJsonHeaders().then(function (headers) {
        if (!headers) {
          setReady(true);
          return;
        }
        fetch("/api/profiles", { headers })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (data && !data.error) {
              setMine({ profile: data.profile || null, linked: !!data.linked });
              if (data.profile) setDone(true);
            }
            setReady(true);
          })
          .catch(function () {
            setReady(true);
          });
      });
    });
  }, []);

  function setField(key: keyof ProfileWritePayload, value: string) {
    setForm(function (prev) {
      return { ...prev, [key]: value };
    });
    if (error) setError("");
  }

  function submit() {
    for (const key of REQUIRED_PROFILE_FIELDS) {
      if (!form[key].trim()) {
        setError("Please fill in your name, gender, and city.");
        return;
      }
    }

    setSaving(true);
    setError("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setSaving(false);
          setSignedIn(false);
          setError("Sign in to create a profile.");
          return null;
        }
        return fetch("/api/profiles", {
          method: "POST",
          headers,
          body: JSON.stringify(form),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setSaving(false);
          if (!res.ok) {
            setError(data.error || "Could not submit your profile.");
            if (res.status === 401) setSignedIn(false);
            return;
          }
          setDone(true);
          setMine({ profile: data.data?.[0] || { status: "pending" }, linked: !!data.linked });
        });
      })
      .catch(function () {
        setSaving(false);
        setError("Network trouble. Try again?");
      });
  }

  const alreadyPending = mine?.profile?.status === "pending";
  const alreadyLive = mine?.profile?.status === "live";

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      {!ready ? (
        <p className="bm-sans" style={{ color: MUTED, fontSize: 14 }}>
          One moment…
        </p>
      ) : !signedIn ? (
        <section
          className="bm-card"
          style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "36px 22px", textAlign: "center" }}
        >
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 400 }}>
            Sign in to create a profile
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
            Profiles are only accepted from an account, then a reviewer puts them live.
          </p>
          <Link
            href="/login?next=/profile/new"
            className="bm-sans bm-talk bm-focus"
            style={{
              display: "inline-block",
              background: VIOLET,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to login
          </Link>
        </section>
      ) : done ? (
        <section
          className="bm-card"
          style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "36px 22px", textAlign: "center" }}
        >
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: ".16em", color: VIOLET }}>
            SUBMITTED FOR REVIEW
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 400 }}>
            {alreadyLive ? "Your profile is live." : "Submitted for review"}
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
            {alreadyLive
              ? "A reviewer already approved this profile."
              : alreadyPending
                ? "A reviewer will approve it before it appears on Browse. It is not live yet."
                : "A reviewer will approve it before it appears on Browse. It is not live yet."}
          </p>
          <Link
            href="/"
            className="bm-sans bm-talk bm-focus"
            style={{
              display: "inline-block",
              background: VIOLET,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to browse
          </Link>
        </section>
      ) : (
        <>
          <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
            YOUR PROFILE
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
            Tell us who you are
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
            This goes to a reviewer first. Nothing appears on Browse until someone approves it.
          </p>

          <form
            onSubmit={function (e) {
              e.preventDefault();
              submit();
            }}
            className="bm-card"
            style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              {PROFILE_FORM_FIELDS.map(function (field) {
                const value = form[field.key];
                const label = (
                  <label
                    htmlFor={"pf-" + field.key}
                    className="bm-sans"
                    style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}
                  >
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                );
                const shared = {
                  id: "pf-" + field.key,
                  value,
                  required: !!field.required,
                  className: "bm-sans bm-input bm-focus",
                  style: {
                    width: "100%",
                    padding: "13px 15px",
                    border: "1px solid " + LINE,
                    borderRadius: 10,
                    fontSize: 14.5,
                    color: INK,
                    background: WASH,
                    outline: "none" as const,
                    boxSizing: "border-box" as const,
                  },
                };

                return (
                  <div key={field.key}>
                    {label}
                    {field.kind === "select" ? (
                      <select
                        {...shared}
                        onChange={function (e) {
                          setField(field.key, e.target.value);
                        }}
                      >
                        <option value="">{field.placeholder}</option>
                        {(field.options || []).map(function (opt) {
                          return (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          );
                        })}
                      </select>
                    ) : field.kind === "textarea" ? (
                      <textarea
                        {...shared}
                        rows={4}
                        placeholder={field.placeholder}
                        onChange={function (e) {
                          setField(field.key, e.target.value);
                        }}
                        style={{ ...shared.style, minHeight: 96, resize: "vertical" }}
                      />
                    ) : (
                      <input
                        {...shared}
                        type="text"
                        placeholder={field.placeholder}
                        onChange={function (e) {
                          setField(field.key, e.target.value);
                        }}
                      />
                    )}
                    {field.hint ? (
                      <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 12, color: MUTED }}>
                        {field.hint}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div style={{ minHeight: 20, margin: "16px 0 14px" }}>
              {error ? (
                <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: VIOLET_DEEP }}>
                  {error}
                </p>
              ) : (
                <p className="bm-sans" style={{ margin: 0, fontSize: 12.5, color: MUTED }}>
                  Name, gender, and city are required. Status will be pending, not live.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bm-sans bm-talk bm-focus"
              style={{
                width: "100%",
                background: saving ? VIOLET_DEEP : VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "13px",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        </>
      )}
    </AppChrome>
  );
}
