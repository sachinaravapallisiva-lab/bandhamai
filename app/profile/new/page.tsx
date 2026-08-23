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
import { parseInstagramInput } from "../../../lib/instagram";
import { emptyPhotoUrls, PROFILE_PHOTO_REQUIRED_ERROR, type ProfilePhotoUrls } from "../../../lib/profile-photos";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../../lib/theme";
import AppChrome, { ChromeLink } from "../../components/AppChrome";
import InstagramField from "../../components/InstagramField";
import PhotoUpload from "../../components/PhotoUpload";
import VerifyOffer from "../../components/VerifyOffer";

type Mine = {
  profile: {
    id?: string;
    status?: string;
    full_name?: string | null;
    city?: string | null;
    profession?: string | null;
    photo_url?: string | null;
    photo_blurred_url?: string | null;
    instagram?: string | null;
  } | null;
  linked: boolean;
} | null;

export default function NewProfilePage() {
  const [ready, setReady] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [form, setForm] = useState<ProfileWritePayload>(() => emptyProfileForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [mine, setMine] = useState<Mine>(null);
  const [photos, setPhotos] = useState<ProfilePhotoUrls>(() => emptyPhotoUrls());
  const [photoBusy, setPhotoBusy] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialNote, setSocialNote] = useState("");

  useEffect(function () {
    let cancelled = false;

    function finishAnon() {
      if (cancelled) return;
      setSignedIn(false);
      setReady(true);
    }

    const timeout = window.setTimeout(finishAnon, 4000);

    supabase.auth
      .getSession()
      .then(function (result) {
        if (cancelled) return;
        const session = result.data.session;
        if (!session) {
          window.clearTimeout(timeout);
          finishAnon();
          return;
        }
        setSignedIn(true);
        authJsonHeaders().then(function (headers) {
          if (cancelled) return;
          if (!headers) {
            window.clearTimeout(timeout);
            setReady(true);
            return;
          }
          fetch("/api/profiles", { headers })
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              if (cancelled) return;
              window.clearTimeout(timeout);
              if (data && !data.error) {
                setMine({ profile: data.profile || null, linked: !!data.linked });
                if (data.profile) {
                  setDone(true);
                  setForm(function (prev) {
                    return { ...prev, instagram: data.profile.instagram || "" };
                  });
                  setPhotos({
                    photo_url: data.profile.photo_url || "",
                    photo_blurred_url: data.profile.photo_blurred_url || "",
                  });
                }
              }
              setReady(true);
            })
            .catch(function () {
              if (cancelled) return;
              window.clearTimeout(timeout);
              setReady(true);
            });
        });
      })
      .catch(function () {
        window.clearTimeout(timeout);
        finishAnon();
      });

    return function () {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  function setField(key: keyof ProfileWritePayload, value: string) {
    setForm(function (prev) {
      return { ...prev, [key]: value };
    });
    if (error) setError("");
    if (socialNote) setSocialNote("");
  }

  function saveInstagram() {
    const parsed = parseInstagramInput(form.instagram);
    if (parsed.error) {
      setSocialNote(parsed.error);
      return;
    }

    setSavingSocial(true);
    setSocialNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setSavingSocial(false);
          setSignedIn(false);
          setSocialNote("Sign in to save Instagram.");
          return null;
        }
        return fetch("/api/profiles", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ instagram: form.instagram }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setSavingSocial(false);
          if (!res.ok) {
            setSocialNote(data.error || "Could not save Instagram.");
            if (res.status === 401) setSignedIn(false);
            return;
          }
          const handle = data.profile?.instagram || parsed.handle || "";
          setForm(function (prev) {
            return { ...prev, instagram: handle };
          });
          setMine(function (prev) {
            if (!prev) return prev;
            return {
              ...prev,
              profile: { ...(prev.profile || {}), instagram: handle || null },
            };
          });
          setSocialNote(handle ? "Instagram saved." : "Instagram removed.");
        });
      })
      .catch(function () {
        setSavingSocial(false);
        setSocialNote("Network trouble. Try again?");
      });
  }

  function submit() {
    for (const key of REQUIRED_PROFILE_FIELDS) {
      if (!form[key].trim()) {
        setError("Please fill in your name, gender, and city.");
        return;
      }
    }
    if (!photos.photo_url) {
      setError(PROFILE_PHOTO_REQUIRED_ERROR);
      return;
    }
    const instagram = parseInstagramInput(form.instagram);
    if (instagram.error) {
      setError(instagram.error);
      return;
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
          body: JSON.stringify({
            ...form,
            photo_url: photos.photo_url || undefined,
            photo_blurred_url: photos.photo_blurred_url || undefined,
          }),
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
          setMine({
            profile: data.data?.[0] || {
              status: "pending",
              photo_url: photos.photo_url || null,
              photo_blurred_url: photos.photo_blurred_url || null,
              full_name: form.full_name,
              city: form.city,
              profession: form.profession,
            },
            linked: !!data.linked,
          });
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
          <div style={{ textAlign: "left", margin: "0 0 22px" }}>
            <PhotoUpload
              value={photos}
              onChange={setPhotos}
              name={mine?.profile?.full_name || form.full_name}
              city={mine?.profile?.city || form.city}
              profession={mine?.profile?.profession || form.profession}
            />
          </div>
          <div style={{ textAlign: "left", margin: "0 0 22px" }}>
            <InstagramField
              value={form.instagram}
              onChange={function (value) {
                setField("instagram", value);
              }}
              disabled={savingSocial}
            />
            <button
              type="button"
              disabled={savingSocial}
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
                cursor: savingSocial ? "default" : "pointer",
                opacity: savingSocial ? 0.7 : 1,
              }}
            >
              {savingSocial ? "Saving…" : "Save Instagram"}
            </button>
            {socialNote ? (
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                {socialNote}
              </p>
            ) : (
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
                Optional. You can add or clear Instagram after submit. Empty is fine.
              </p>
            )}
          </div>
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
          <div style={{ marginTop: 22, textAlign: "left" }}>
            <VerifyOffer signedIn={signedIn} nextPath="/profile/new" />
          </div>
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
              <PhotoUpload
                value={photos}
                onChange={function (next) {
                  setPhotos(next);
                  if (error) setError("");
                }}
                onBusyChange={setPhotoBusy}
                name={form.full_name}
                city={form.city}
                profession={form.profession}
                disabled={saving}
                required
              />
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
                        {(field.optionGroups || []).map(function (group) {
                          return (
                            <optgroup key={group.heading} label={group.heading}>
                              {group.options.map(function (opt) {
                                return (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                );
                              })}
                            </optgroup>
                          );
                        })}
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
              <InstagramField
                value={form.instagram}
                onChange={function (value) {
                  setField("instagram", value);
                }}
                disabled={saving}
              />
            </div>

            <div style={{ minHeight: 20, margin: "16px 0 14px" }}>
              {error ? (
                <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: VIOLET_DEEP }}>
                  {error}
                </p>
              ) : (
                <p className="bm-sans" style={{ margin: 0, fontSize: 12.5, color: MUTED }}>
                  Name, gender, city, and a profile photo are required. Status will be pending, not live.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || photoBusy || !photos.photo_url}
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
                cursor: saving || photoBusy || !photos.photo_url ? "default" : "pointer",
                opacity: saving || photoBusy || !photos.photo_url ? 0.7 : 1,
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
