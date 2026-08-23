import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Matches",
  description: "People you marked Interested on Bandham AI.",
};

/** So /login?next=/matches lands on the Matches tab instead of a 404. */
export default function MatchesPage() {
  redirect("/?tab=matches");
}
