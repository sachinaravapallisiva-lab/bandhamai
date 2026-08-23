import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign out, manage blocks, or delete your Bandham AI account.",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
