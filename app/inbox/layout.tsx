import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Received messages on Bandham AI.",
};

export default function InboxLayout({ children }: { children: ReactNode }) {
  return children;
}
