"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { authJsonHeaders } from "../../lib/client-auth";
import { BILLING_COPY, emptyEntitlement } from "../../lib/billing";
import {
  confirmCheckoutSession,
  fetchEntitlement,
  openBillingPortal,
  sendPaidMessage,
  startCheckout,
} from "../../lib/client-billing";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_LOOKUP_PATH } from "../../lib/presence";
import { INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import MessagePaywall from "../components/MessagePaywall";
import InstagramShareControls from "../components/InstagramShareControls";
import PresenceMark from "../components/PresenceMark";
import SafetyActions from "../components/SafetyActions";

type ChatMessage = {
  id?: string;
  sender_id?: string;
  recipient_id?: string;
  body?: string;
};

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [entitlement, setEntitlement] = useState(emptyEntitlement({ configured: true }));
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingNote, setBillingNote] = useState("");
  const [partnerPresence, setPartnerPresence] = useState<{ id: string; online: boolean } | null>(null);
  const recipientRef = useRef("");
  const partnerOnline = !!(partnerPresence && partnerPresence.id === recipientId && partnerPresence.online);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");
        fetchEntitlement().then(function (next) {
          setEntitlement(next);
        });
      } else {
        setStatus("Not signed in. Go to /login first.");
      }
    });
  }, []);

  useEffect(function () {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || "";
    if (params.get("billing") === "success" && sessionId) {
      confirmCheckoutSession(sessionId).then(function (next) {
        setEntitlement(next);
        if (next.canMessage) setBillingNote("Subscription is active. You can send messages.");
      });
    }
  }, []);

  useEffect(function () {
    recipientRef.current = recipientId;
  }, [recipientId]);

  useEffect(function () {
    if (!userId || !recipientId) return;

    let cancelled = false;
    const lookingUp = recipientId;

    function loadPartner() {
      authJsonHeaders()
        .then(function (headers) {
          if (!headers) return { online: false };
          return fetch(PRESENCE_LOOKUP_PATH + "?user_id=" + encodeURIComponent(lookingUp), { headers })
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              return { online: !!data.online };
            })
            .catch(function () {
              return { online: false };
            });
        })
        .then(function (result) {
          if (cancelled) return;
          setPartnerPresence({ id: lookingUp, online: !!(result && result.online) });
        });
    }

    loadPartner();
    const id = window.setInterval(loadPartner, PRESENCE_HEARTBEAT_MS);
    return function () {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [userId, recipientId]);

  useEffect(function () {
    if (!userId) return;

    const channel = supabase
      .channel("messages-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        function (payload) {
          const row = payload.new as ChatMessage;
          const other = recipientRef.current;
          if (row.sender_id === other || row.recipient_id === other) {
            setMessages(function (prev) {
              return prev.concat(row);
            });
          }
        }
      )
      .subscribe();

    return function () {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function loadMessages() {
    if (!recipientId) {
      setStatus("Enter a recipient ID first.");
      return;
    }
    setStatus("Loading...");
    supabase
      .from("messages")
      .select("*")
      .or(
        "and(sender_id.eq." +
          userId +
          ",recipient_id.eq." +
          recipientId +
          "),and(sender_id.eq." +
          recipientId +
          ",recipient_id.eq." +
          userId +
          ")"
      )
      .order("created_at", { ascending: true })
      .then(function (result) {
        if (result.error) {
          setStatus("Error: " + result.error.message);
        } else {
          setMessages((result.data || []) as ChatMessage[]);
          setStatus("");
        }
      });
  }

  function goLogin() {
    router.push("/login?next=/chat");
  }

  function beginCheckout() {
    if (!userId) {
      goLogin();
      return;
    }
    setBillingBusy(true);
    setBillingNote("");
    startCheckout().then(function (result) {
      setBillingBusy(false);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setBillingNote(result.error || BILLING_COPY.notConfigured);
    });
  }

  function beginPortal() {
    setBillingBusy(true);
    openBillingPortal().then(function (result) {
      setBillingBusy(false);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setBillingNote(result.error || "Could not open the billing portal.");
    });
  }

  function sendMessage() {
    if (!draft || !recipientId) return;
    if (!userId) {
      goLogin();
      return;
    }
    if (!entitlement.canMessage) {
      setBillingNote(entitlement.configured ? BILLING_COPY.headline : BILLING_COPY.notConfigured);
      return;
    }

    const text = draft;
    setDraft("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) return { blocked: false };
        return fetch("/api/blocks?user_id=" + encodeURIComponent(recipientId), { headers })
          .then(function (r) { return r.json(); })
          .then(function (data) { return { blocked: !!data.blocked }; })
          .catch(function () { return { blocked: false }; });
      })
      .then(function (gate) {
        if (gate.blocked) {
          setDraft(text);
          setStatus("You cannot message this person. One of you blocked the other.");
          return;
        }
        return sendPaidMessage(recipientId, text).then(function (result) {
          if (result.ok) {
            setStatus("");
            return;
          }
          if (result.code === "subscription_required" || result.status === 402) {
            setDraft(text);
            setEntitlement(emptyEntitlement({ ...entitlement, canMessage: false }));
            setBillingNote(BILLING_COPY.headline);
            return;
          }
          setDraft(text);
          setStatus("Send failed: " + result.error);
        });
      });
  }

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 8px" }}>
        CHAT
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 400 }}>
        Messages
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 18px", fontSize: 13.5, color: MUTED }}>
        You: {userEmail || "signed out"}
      </p>

      {recipientId ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "#FFFFFF",
            border: "1px solid " + LINE,
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div>
            <span className="bm-serif" style={{ fontSize: 18 }}>
              Conversation
            </span>
            <InstagramShareControls
              userId={recipientId}
              signedIn={!!userId}
              initialHandle=""
            />
          </div>
          <PresenceMark online={partnerOnline} compact />
        </div>
      ) : null}

      {!entitlement.canMessage ? (
        <MessagePaywall
          entitlement={entitlement}
          busy={billingBusy}
          note={billingNote}
          signedIn={!!userId}
          onSubscribe={beginCheckout}
          onManage={beginPortal}
          onSignIn={goLogin}
        />
      ) : billingNote ? (
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>
          {billingNote}
        </p>
      ) : null}

      <input
        placeholder="Recipient user ID"
        value={recipientId}
        onChange={function (e) {
          setRecipientId(e.target.value);
        }}
        className="bm-sans bm-input bm-focus"
        style={{
          width: "100%",
          padding: "13px 15px",
          border: "1px solid " + LINE,
          borderRadius: 10,
          fontSize: 14.5,
          color: INK,
          background: WASH,
          outline: "none",
          boxSizing: "border-box",
          marginBottom: 10,
        }}
      />
      <button
        onClick={loadMessages}
        className="bm-sans bm-ghost bm-focus"
        style={{
          background: "transparent",
          color: VIOLET,
          border: "1px solid " + LINE,
          borderRadius: 999,
          padding: "10px 16px",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        Load conversation
      </button>

      {recipientId ? (
        <SafetyActions
          userId={recipientId}
          surface="chat"
          signedIn={!!userId}
          nextPath="/chat"
        />
      ) : (
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 12.5, color: MUTED }}>
          Enter a recipient to block or report this conversation.
        </p>
      )}

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "16px",
          minHeight: 160,
          marginBottom: 12,
        }}
      >
        {messages.map(function (m) {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} style={{ textAlign: mine ? "right" : "left", marginBottom: 8 }}>
              <span
                className="bm-sans"
                style={{
                  display: "inline-block",
                  background: mine ? VIOLET : WASH,
                  color: mine ? "#FFFFFF" : INK,
                  border: mine ? "none" : "1px solid " + LINE,
                  padding: "10px 14px",
                  borderRadius: 13,
                  fontSize: 14,
                }}
              >
                {m.body}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 9 }}>
        <input
          value={draft}
          onChange={function (e) {
            setDraft(e.target.value);
          }}
          placeholder="Type a message"
          className="bm-sans bm-input bm-focus"
          style={{
            flex: 1,
            padding: "11px 14px",
            border: "1px solid " + LINE,
            borderRadius: 999,
            fontSize: 14,
            background: WASH,
            color: INK,
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          className="bm-sans bm-talk bm-focus"
          style={{
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "11px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>

      {status ? (
        <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13.5, color: MUTED }}>
          {status}
        </p>
      ) : null}
    </AppChrome>
  );
}
