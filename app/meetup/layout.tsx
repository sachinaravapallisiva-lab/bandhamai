import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Meetup this month",
  description: "A virtual matrimony meetup on Bandham AI.",
};

export default function MeetupLayout({ children }: { children: ReactNode }) {
  return children;
}
