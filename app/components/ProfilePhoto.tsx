import { PROFILE_PHOTO_FALLBACK, PROFILE_PHOTO_HEIGHT, PROFILE_PHOTO_SOON } from "../../lib/profile-card";
import { INK, LINE, MUTED, WASH } from "../../lib/theme";

export function ProfilePhoto({
  src,
  alt,
  size = 120,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    // Processed by our API (WebP). next/image remote config is not wired for Storage yet.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 14,
        border: "1px solid " + LINE,
        background: WASH,
        display: "block",
      }}
    />
  );
}

/** Honest no-photo treatment. Cream only. Not an initial gradient that looks like a face. */
export function ProfilePhotoSoon({ name }: { name: string }) {
  const label = PROFILE_PHOTO_SOON;
  return (
    <div
      role="img"
      aria-label={name ? name + " " + label.toLowerCase() : label}
      style={{
        height: PROFILE_PHOTO_HEIGHT,
        background: PROFILE_PHOTO_FALLBACK,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        borderBottom: "1px solid " + LINE,
      }}
    >
      <span className="bm-sans" style={{ fontSize: 13, color: MUTED, letterSpacing: ".01em" }}>
        {label}
      </span>
    </div>
  );
}

export function PhotoCardPreview({
  photoUrl,
  name,
  city,
  profession,
}: {
  photoUrl: string;
  name: string;
  city: string;
  profession: string;
}) {
  const subtitle = [city, profession].filter(Boolean).join(" · ");
  return (
    <article
      className="bm-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "16px",
        display: "flex",
        gap: 14,
        alignItems: "center",
      }}
    >
      {photoUrl ? (
        <ProfilePhoto src={photoUrl} alt={name ? name + " profile photo" : "Profile photo"} size={88} />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: 88,
            height: 88,
            borderRadius: 14,
            border: "1px dashed " + LINE,
            background: WASH,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 10, letterSpacing: ".14em", color: MUTED }}>
          CARD PREVIEW
        </p>
        <h3 className="bm-serif" style={{ margin: 0, fontSize: 20, fontWeight: 400, color: INK }}>
          {name || "Your name"}
        </h3>
        <p className="bm-sans" style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>
          {subtitle || "City · profession"}
        </p>
      </div>
    </article>
  );
}
