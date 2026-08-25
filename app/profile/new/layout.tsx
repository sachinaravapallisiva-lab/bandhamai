import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create profile",
  description: "Submit a Bandham AI profile for review.",
};

export default function NewProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
