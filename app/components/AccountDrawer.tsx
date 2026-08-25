"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ACCOUNT_MENU_BIODATA_ID,
  ACCOUNT_MENU_CLOSE_LABEL,
  ACCOUNT_MENU_DIALOG_ID,
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_MENU_OPEN_LABEL,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_SIGN_IN,
  ACCOUNT_MENU_SIGN_OUT,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_MENU_UPGRADE,
  ACCOUNT_MENU_UPGRADE_HREF,
} from "../../lib/account-menu";
import { authJsonHeaders } from "../../lib/client-auth";
import { fetchEntitlement } from "../../lib/client-billing";
import { loginHref } from "../../lib/next-path";
import { supabase } from "../../lib/supabase";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import DownloadBiodata from "./DownloadBiodata";

type IconName =
  | "menu"
  | "close"
  | "profile"
  | "preferences"
  | "browse"
  | "meetup"
  | "messages"
  | "inbox"
  | "block"
  | "verifyai"
  | "biodata"
  | "help"
  | "call"
  | "settings"
  | "upgrade"
  | "signin";

function MenuIcon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
  };
  const stroke = VIOLET_DEEP;

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M5 7h14M5 12h14M5 17h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7 7 17" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.2" r="3.1" stroke={stroke} strokeWidth="1.7" />
        <path d="M5.6 18.4c.8-3 3.3-4.6 6.4-4.6s5.6 1.6 6.4 4.6" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "preferences") {
    return (
      <svg {...common}>
        <path d="M5 8h14M5 16h14" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="9" cy="8" r="2" fill={CREAM} stroke={stroke} strokeWidth="1.7" />
        <circle cx="15" cy="16" r="2" fill={CREAM} stroke={stroke} strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === "browse") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="5.4" stroke={stroke} strokeWidth="1.7" />
        <path d="M15.4 15.4 19 19" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "meetup") {
    return (
      <svg {...common}>
        <rect x="5" y="6.5" width="14" height="13" rx="2" stroke={stroke} strokeWidth="1.7" />
        <path d="M8 5v3M16 5v3M5 10.5h14" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "messages") {
    return (
      <svg {...common}>
        <path
          d="M5.5 6.5h13c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5H9.2L5 20.2V8c0-.8.7-1.5 1.5-1.5Z"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "verifyai") {
    return (
      <svg {...common}>
        <path
          d="M12 3.4 18.2 6v5.2c0 4-2.7 7.4-6.2 8.4-3.5-1-6.2-4.4-6.2-8.4V6L12 3.4Z"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "biodata") {
    return (
      <svg {...common}>
        <path d="M8 4.5h6.2L18 8.3V19c0 .8-.7 1.5-1.5 1.5h-8C7.7 20.5 7 19.8 7 19V6c0-.8.7-1.5 1-1.5Z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M14 4.8V8h3.4M9.4 12h5.2M9.4 15.2h3.8" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "help") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.2" stroke={stroke} strokeWidth="1.7" />
        <path d="M9.8 9.6c.4-1.4 2.6-1.8 3.4-.4.6 1 .1 1.8-1 2.4-.6.3-.9.8-.9 1.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="16.4" r="0.8" fill={stroke} />
      </svg>
    );
  }
  if (name === "call") {
    return (
      <svg {...common}>
        <path
          d="M8.4 5.8c.4-.7 1.3-.9 2-.4l1.4 1c.6.4.7 1.2.4 1.8l-.5 1.2c-.2.4 0 .8.3 1.1 1 1 2.2 1.9 3.4 2.6.4.2.8.1 1.1-.2l1-1c.6-.6 1.6-.6 2.2 0l1.2 1.2c.7.7.6 1.8-.2 2.3-1.2.9-2.8 1.5-4.5 1.1-3.1-.7-6-3-7.9-5.9C6.8 9.2 6.8 7.2 8.4 5.8Z"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.7" />
        <path
          d="M12 5.2v-1M12 19.8v1M5.2 12h-1M19.8 12h1M7 7l-.8-.8M17.8 17.8l-.8-.8M17 7l.8-.8M6.2 17.8l.8-.8"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === "block") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.2" r="3.1" stroke={stroke} strokeWidth="1.7" />
        <path d="M5.6 18.4c.8-3 3.3-4.6 6.4-4.6s5.6 1.6 6.4 4.6" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6.2 6.2 17.8 17.8" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "upgrade") {
    return (
      <svg {...common}>
        <path d="M12 17.5V7M8 10.5 12 6.5l4 4" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8.2" r="3.1" stroke={stroke} strokeWidth="1.7" />
      <path d="M5.6 18.4c.8-3 3.3-4.6 6.4-4.6s5.6 1.6 6.4 4.6M16.6 12.2h3.6M18.4 10.4v3.6" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function iconForItem(id: string): IconName {
  if (id === "profile") return "profile";
  if (id === "preferences") return "preferences";
  if (id === "browse") return "browse";
  if (id === "meetup") return "meetup";
  if (id === "messages" || id === "inbox") return "messages";
  if (id === "block") return "block";
  if (id === "verifyai") return "verifyai";
  if (id === "help") return "help";
  if (id === "call") return "call";
  if (id === "settings") return "settings";
  return "profile";
}

const FOCUSABLE =
  "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";

const ITEM_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minHeight: 44,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  textDecoration: "none",
  color: INK,
  boxSizing: "border-box" as const,
};

export default function AccountDrawer() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [plan, setPlan] = useState<"free" | "paid" | null>(null);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (!session) {
        setSignedIn(false);
        setEmail("");
        setPlan(null);
        return;
      }
      setSignedIn(true);
      setEmail(session.user.email || "");
      Promise.all([
        fetchEntitlement(),
        authJsonHeaders().then(function (headers) {
          if (!headers) return null;
          return fetch("/api/profiles", { headers }).then(function (res) {
            return res.json();
          });
        }),
      ])
        .then(function (result) {
          const entitlement = result[0];
          const data = result[1];
          setPlan(entitlement.canMessage ? "paid" : "free");
          setHasProfile(!!(data && data.profile && data.profile.id));
        })
        .catch(function () {
          setPlan("free");
          setHasProfile(false);
        });
    });
  }, []);

  useEffect(
    function () {
      if (!open) return;

      const previous = document.activeElement;
      const trigger = triggerRef.current;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const toFocus = closeRef.current;
      if (toFocus) toFocus.focus();

      function onKey(event: KeyboardEvent) {
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          return;
        }
        if (event.key !== "Tab") return;
        const root = panelRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(function (node) {
          return !node.hasAttribute("disabled") && node.tabIndex !== -1;
        });
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }

      document.addEventListener("keydown", onKey);
      return function () {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = previousOverflow;
        if (previous instanceof HTMLElement) previous.focus();
        else if (trigger) trigger.focus();
      };
    },
    [open]
  );

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="bm-sans bm-ghost bm-focus"
        aria-label={ACCOUNT_MENU_OPEN_LABEL}
        aria-expanded={open}
        aria-controls={ACCOUNT_MENU_DIALOG_ID}
        onClick={function () {
          setOpen(true);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minWidth: 44,
          minHeight: 44,
          padding: "8px 12px",
          background: "transparent",
          color: VIOLET,
          border: "1px solid " + LINE,
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <MenuIcon name="menu" />
        <span>Menu</span>
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
          }}
        >
          <button
            type="button"
            className="bm-scrim"
            aria-label={ACCOUNT_MENU_CLOSE_LABEL}
            onClick={close}
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              background: "rgba(30, 27, 54, 0.28)",
              cursor: "pointer",
              opacity: 1,
            }}
          />
          <div
            ref={panelRef}
            id={ACCOUNT_MENU_DIALOG_ID}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bm-drawer"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
              height: "100%",
              width: "min(340px, 88vw)",
              background: CREAM,
              borderRight: "1px solid " + LINE,
              boxShadow: "8px 0 28px rgba(45,27,54,.10)",
              display: "flex",
              flexDirection: "column",
              transform: "translateX(0)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "18px 16px 12px",
                borderBottom: "1px solid " + LINE,
              }}
            >
              <div>
                <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                  BANDHAM AI
                </p>
                <h2 id={titleId} className="bm-serif" style={{ margin: 0, fontSize: 24, fontWeight: 400, color: INK }}>
                  {ACCOUNT_MENU_TITLE}
                </h2>
                {signedIn ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span
                      className="bm-sans"
                      style={{
                        fontSize: 12.5,
                        color: MUTED,
                        maxWidth: 170,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {email || "Signed in"}
                    </span>
                    {plan ? (
                      <span
                        className="bm-sans"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 24,
                          padding: "2px 8px",
                          borderRadius: 999,
                          border: "1px solid " + LINE,
                          background: WASH,
                          color: plan === "paid" ? VIOLET_DEEP : MUTED,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {plan === "paid" ? ACCOUNT_MENU_PAID_CHIP : ACCOUNT_MENU_FREE_CHIP}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button
                ref={closeRef}
                type="button"
                className="bm-sans bm-ghost bm-focus"
                aria-label={ACCOUNT_MENU_CLOSE_LABEL}
                onClick={close}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minWidth: 44,
                  minHeight: 44,
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid " + LINE,
                  borderRadius: 999,
                  color: VIOLET,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <MenuIcon name="close" />
                <span>Close</span>
              </button>
            </div>

            <nav aria-label={ACCOUNT_MENU_TITLE} style={{ padding: "12px 10px 18px", overflowY: "auto" }}>
              {!signedIn ? (
                <Link
                  href={loginHref("/")}
                  onClick={close}
                  className="bm-sans bm-talk bm-focus"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 44,
                    margin: "0 6px 12px",
                    background: VIOLET,
                    color: "#FFFFFF",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {ACCOUNT_MENU_SIGN_IN}
                </Link>
              ) : null}

              {ACCOUNT_MENU_ITEMS.map(function (item) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={close}
                    className="bm-sans bm-menu bm-focus"
                    style={ITEM_STYLE}
                  >
                    <MenuIcon name={iconForItem(item.id)} />
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{item.label}</span>
                      {"hint" in item && item.hint ? (
                        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{item.hint}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}

              {signedIn ? (
                <div
                  className="bm-menu"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 44,
                    padding: "8px 12px",
                    borderRadius: 12,
                  }}
                >
                  <MenuIcon name={ACCOUNT_MENU_BIODATA_ID} />
                  <DownloadBiodata hasProfile={hasProfile} compact />
                </div>
              ) : null}

              {signedIn && plan === "free" ? (
                <Link
                  href={ACCOUNT_MENU_UPGRADE_HREF}
                  onClick={close}
                  className="bm-sans bm-menu bm-focus"
                  style={ITEM_STYLE}
                >
                  <MenuIcon name="upgrade" />
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{ACCOUNT_MENU_UPGRADE}</span>
                </Link>
              ) : null}

              {signedIn ? (
                <Link
                  href="/logout"
                  onClick={close}
                  className="bm-sans bm-menu bm-focus"
                  style={{ ...ITEM_STYLE, color: MUTED, marginTop: 8 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{ACCOUNT_MENU_SIGN_OUT}</span>
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
