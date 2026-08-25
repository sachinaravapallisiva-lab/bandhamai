import { BANDHAM_MARK_ALT, BANDHAM_MARK_SIZE, BANDHAM_MARK_SRC } from "../../lib/bandham-mark";

/** Small varmala couple mark. Sit beside Bandham AI. Not a hero drawing. */
export default function BandhamMark({
  size = BANDHAM_MARK_SIZE,
}: {
  size?: number;
}) {
  return (
    // Brand PNG from the Sai garland lock. next/image is unused for this tiny mark.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BANDHAM_MARK_SRC}
      alt={BANDHAM_MARK_ALT}
      width={size}
      height={size}
      data-bandham-mark="garland-couple"
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
        background: "#FDF8F1",
      }}
    />
  );
}
