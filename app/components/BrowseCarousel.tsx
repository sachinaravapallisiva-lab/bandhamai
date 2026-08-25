"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BrowseProfile } from "../../lib/profile-search";
import {
  BROWSE_CAROUSEL_ADVANCE_MS,
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_EMPTY_BODY,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_GAP,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_PEEK,
  BROWSE_CAROUSEL_PREV,
  clampCarouselIndex,
  nextCarouselIndex,
  prevCarouselIndex,
  shouldAutoAdvance,
} from "../../lib/browse-carousel";
import { MUTED, VIOLET } from "../../lib/theme";
import DiscoverCard from "./DiscoverCard";
import EmptyState from "./EmptyState";

export default function BrowseCarousel({
  profiles,
  saved,
  signedIn,
  nextPath = "/",
  onInterested,
  onPass,
  onSave,
  onBlocked,
}: {
  profiles: BrowseProfile[];
  saved: BrowseProfile[];
  signedIn: boolean;
  nextPath?: string;
  onInterested: (profile: BrowseProfile) => void;
  onPass: (profile: BrowseProfile) => void;
  onSave: (profile: BrowseProfile) => void;
  onBlocked: (profile: BrowseProfile) => void;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const safeIndex = clampCarouselIndex(index, profiles.length);

  useEffect(function () {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduceMotion(media.matches);
    }
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return function () {
        media.removeEventListener("change", sync);
      };
    }
    media.addListener(sync);
    return function () {
      media.removeListener(sync);
    };
  }, []);

  useLayoutEffect(function () {
    const el = viewportRef.current;
    if (!el) return;
    function measure() {
      const width = el.clientWidth - BROWSE_CAROUSEL_PEEK * 2;
      setSlideWidth(width > 0 ? width : 0);
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return function () {
      observer.disconnect();
    };
  }, [profiles.length]);

  useEffect(function () {
    if (!shouldAutoAdvance({ reduceMotion, count: profiles.length, paused })) return;
    const timer = window.setInterval(function () {
      setIndex(function (current) {
        return nextCarouselIndex(current, profiles.length);
      });
    }, BROWSE_CAROUSEL_ADVANCE_MS);
    return function () {
      window.clearInterval(timer);
    };
  }, [reduceMotion, paused, profiles.length, safeIndex]);

  if (profiles.length === 0) {
    return (
      <EmptyState
        eyebrow="BROWSE"
        title={BROWSE_CAROUSEL_EMPTY_TITLE}
        body={BROWSE_CAROUSEL_EMPTY_BODY}
      />
    );
  }

  const stepPx = slideWidth + BROWSE_CAROUSEL_GAP;
  const offset = slideWidth
    ? BROWSE_CAROUSEL_PEEK - safeIndex * stepPx
    : BROWSE_CAROUSEL_PEEK;

  return (
    <section
      data-browse-carousel="pond"
      data-auto-advance={shouldAutoAdvance({ reduceMotion, count: profiles.length, paused }) ? "on" : "off"}
      aria-roledescription="carousel"
      aria-label={BROWSE_CAROUSEL_ARIA}
      onMouseEnter={function () {
        setPaused(true);
      }}
      onMouseLeave={function () {
        setPaused(false);
      }}
      onFocusCapture={function () {
        setPaused(true);
      }}
      onBlurCapture={function (event) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={viewportRef}
        style={{
          overflow: "hidden",
          margin: "0 -4px",
        }}
      >
        <div
          data-browse-carousel-track="true"
          style={{
            display: "flex",
            gap: BROWSE_CAROUSEL_GAP,
            transform: "translateX(" + offset + "px)",
            transition: reduceMotion ? "none" : "transform 560ms ease",
            willChange: reduceMotion ? "auto" : "transform",
          }}
        >
          {profiles.map(function (profile, i) {
            const active = i === safeIndex;
            return (
              <div
                key={profile.id}
                aria-hidden={!active}
                data-browse-carousel-slide={active ? "active" : "peek"}
                style={{
                  flex: slideWidth ? "0 0 " + slideWidth + "px" : "0 0 100%",
                  minWidth: 0,
                  opacity: active ? 1 : 0.42,
                  transition: reduceMotion ? "none" : "opacity 560ms ease",
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                <DiscoverCard
                  profile={profile}
                  saved={saved.some(function (item) {
                    return item.id === profile.id;
                  })}
                  signedIn={signedIn}
                  nextPath={nextPath}
                  onInterested={function () {
                    onInterested(profile);
                  }}
                  onPass={function () {
                    onPass(profile);
                  }}
                  onSave={function () {
                    onSave(profile);
                  }}
                  onBlocked={function () {
                    onBlocked(profile);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {profiles.length > 1 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          <button
            type="button"
            className="bm-sans bm-focus"
            onClick={function () {
              setIndex(function (current) {
                return prevCarouselIndex(current, profiles.length);
              });
            }}
            style={{
              background: "none",
              border: "none",
              padding: "4px 0",
              color: VIOLET,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {BROWSE_CAROUSEL_PREV}
          </button>
          <p className="bm-sans" aria-live="polite" style={{ margin: 0, fontSize: 12, color: MUTED }}>
            {safeIndex + 1} of {profiles.length}
          </p>
          <button
            type="button"
            className="bm-sans bm-focus"
            onClick={function () {
              setIndex(function (current) {
                return nextCarouselIndex(current, profiles.length);
              });
            }}
            style={{
              background: "none",
              border: "none",
              padding: "4px 0",
              color: VIOLET,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {BROWSE_CAROUSEL_NEXT}
          </button>
        </div>
      ) : null}
    </section>
  );
}
