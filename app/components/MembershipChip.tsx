import {
  MEMBERSHIP_PREMIUM,
  membershipLabel,
  type ProfileMembership,
} from "../../lib/membership";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";

const PREMIUM_WASH = "#EDE7F6";

/** Quiet Soft Minimal plan chip for other people's live cards. */
export default function MembershipChip({ membership }: { membership?: ProfileMembership }) {
  const premium = membership === MEMBERSHIP_PREMIUM;
  const label = membershipLabel(premium ? MEMBERSHIP_PREMIUM : "regular");

  return (
    <span
      className="bm-sans"
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        minHeight: 22,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid " + (premium ? VIOLET : LINE),
        background: premium ? PREMIUM_WASH : CREAM,
        color: premium ? VIOLET_DEEP : MUTED,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".01em",
      }}
    >
      {label}
    </span>
  );
}
