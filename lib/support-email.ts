import {
  supportFromEmail,
  supportInboxEmail,
  type SupportCategory,
  type SupportTicketDraft,
} from "./support";

export type TicketEmailInput = Omit<SupportTicketDraft, "category"> & {
  id: string;
  userId: string;
  email?: string | null;
  source?: string;
  callerPhone?: string | null;
  category: SupportCategory | "idea";
};

export type TicketEmailResult = {
  sent: boolean;
  error: string | null;
};

function founderEmailLead(ticket: TicketEmailInput) {
  if (ticket.source === "voice") {
    return "A Bandham AI phone support call opened an app issue ticket.";
  }
  if (ticket.source === "idea") {
    return "A Bandham AI member sent a feature idea.";
  }
  return "A Bandham AI member confirmed an app issue ticket.";
}

function founderEmailHtml(ticket: TicketEmailInput) {
  const email = ticket.email || "(no email on the account)";
  const phone = ticket.callerPhone ? "<br><strong>Caller phone:</strong> " + escapeHtml(ticket.callerPhone) : "";
  const userId = ticket.userId || "(not linked)";
  return [
    "<p>" + escapeHtml(founderEmailLead(ticket)) + "</p>",
    "<p><strong>Ticket:</strong> " + escapeHtml(ticket.id) + "<br>",
    "<strong>Category:</strong> " + escapeHtml(ticket.category) + "<br>",
    "<strong>Subject:</strong> " + escapeHtml(ticket.subject) + "<br>",
    "<strong>Member:</strong> " + escapeHtml(email) + phone + "<br>",
    "<strong>User id:</strong> " + escapeHtml(userId) + "</p>",
    "<p>" + escapeHtml(ticket.body).replace(/\n/g, "<br>") + "</p>",
    "<p>This is the in-app support queue, not a safety report and not an emergency alert.</p>",
  ].join("");
}

function founderEmailText(ticket: TicketEmailInput) {
  const email = ticket.email || "(no email on the account)";
  const userId = ticket.userId || "(not linked)";
  const lines = [
    founderEmailLead(ticket),
    "",
    "Ticket: " + ticket.id,
    "Category: " + ticket.category,
    "Subject: " + ticket.subject,
    "Member: " + email,
  ];
  if (ticket.callerPhone) lines.push("Caller phone: " + ticket.callerPhone);
  lines.push("User id: " + userId, "", ticket.body, "");
  lines.push("This is the in-app support queue, not a safety report and not an emergency alert.");
  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notify the founder via Resend. Fail soft: a missing key or a send
 * error must not undo a saved ticket.
 */
export async function emailFounderTicket(ticket: TicketEmailInput): Promise<TicketEmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    console.error("support ticket email skipped: RESEND_API_KEY is not set", ticket.id);
    return { sent: false, error: "RESEND_API_KEY is not set" };
  }

  const inbox = supportInboxEmail();
  if (!inbox) {
    console.error("support ticket email skipped: SUPPORT_INBOX_EMAIL is empty", ticket.id);
    return { sent: false, error: "SUPPORT_INBOX_EMAIL is empty" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: supportFromEmail(),
        to: [inbox],
        subject: "Bandham ticket " + ticket.id.slice(0, 8) + ": " + ticket.category,
        html: founderEmailHtml(ticket),
        text: founderEmailText(ticket),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("support ticket email failed", ticket.id, res.status, detail.slice(0, 400));
      return { sent: false, error: "Resend returned " + res.status };
    }

    return { sent: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("support ticket email error", ticket.id, message);
    return { sent: false, error: message };
  }
}
