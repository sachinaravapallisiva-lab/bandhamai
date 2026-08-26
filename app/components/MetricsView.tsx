"use client";

import { useEffect, useState, type ReactNode } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import {
  METRICS_AGE_LABELS,
  METRICS_AGE_TITLE,
  METRICS_API_PATH,
  METRICS_CITY_TITLE,
  METRICS_EMPTY_BODY,
  METRICS_EMPTY_CITIES,
  METRICS_EMPTY_MARK,
  METRICS_EMPTY_TITLE,
  METRICS_KICKER,
  METRICS_LEAD,
  METRICS_PLACE_TITLE,
  METRICS_READ_FAILED,
  METRICS_REGION_CHIPS,
  METRICS_SHARE_HINT,
  METRICS_TITLE,
  METRICS_TOTAL_LABEL,
  METRICS_UNAVAILABLE_BODY,
  METRICS_UNAVAILABLE_TITLE,
  METRICS_UNKNOWN,
  emptyMemberMetrics,
  placeFromCity,
  shareOfTotal,
  type MetricsBucket,
} from "../../lib/metrics";
import { CREAM, GOLD, INK, LINE, MUTED, PHONE_ACCOUNT_BREAKPOINT, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "./AppChrome";
import BandhamMark from "./BandhamMark";

type MetricsPayload = {
  available?: boolean;
  members?: number;
  regions?: MetricsBucket[];
  cities?: MetricsBucket[];
  ages?: MetricsBucket[];
};

type ViewState =
  | { kind: "closed" }
  | { kind: "unread" }
  | { kind: "ready"; members: number; regions: MetricsBucket[]; cities: MetricsBucket[]; ages: MetricsBucket[] };

const FALLBACK = emptyMemberMetrics();
const BOARD_CSS =
  ".bm-metrics-grid{display:grid;grid-template-columns:1fr;gap:22px}" +
  "@media (min-width:" +
  (PHONE_ACCOUNT_BREAKPOINT + 1) +
  "px){.bm-metrics-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}}" +
  ".bm-metrics-fill{transition:width .35s ease}" +
  "@media (prefers-reduced-motion:reduce){.bm-metrics-fill{transition:none}}";

function asBuckets(raw: unknown): MetricsBucket[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(function (item) {
      if (!item || typeof item !== "object") return null;
      const row = item as { label?: unknown; count?: unknown };
      if (typeof row.label !== "string") return null;
      const count = typeof row.count === "number" && Number.isFinite(row.count) ? row.count : 0;
      return { label: row.label, count: count };
    })
    .filter(function (row): row is MetricsBucket {
      return !!row;
    });
}

function isLocalEmptyPreview() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host !== "127.0.0.1" && host !== "localhost") return false;
  return new URLSearchParams(window.location.search).get("preview") === "empty";
}

function GoldRule() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "18px 0 0",
      }}
    >
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.7 }} />
      <svg width="12" height="12" viewBox="0 0 14 14">
        <path d="M7 1.2 8.4 5.6 12.8 7 8.4 8.4 7 12.8 5.6 8.4 1.2 7 5.6 5.6 7 1.2Z" fill={GOLD} />
      </svg>
      <span style={{ flex: 1, height: 1, background: GOLD, opacity: 0.35 }} />
    </span>
  );
}

function EmptyMark() {
  return (
    <span
      className="bm-sans"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "2px 10px",
        borderRadius: 999,
        border: "1px solid " + LINE,
        background: WASH,
        color: VIOLET_DEEP,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: ".04em",
      }}
    >
      {METRICS_EMPTY_MARK}
    </span>
  );
}

function ShareBar({
  label,
  count,
  total,
  note,
}: {
  label: string;
  count: number;
  total: number;
  note?: string;
}) {
  const share = shareOfTotal(count, total);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "8px 16px",
        alignItems: "center",
        minHeight: 44,
        padding: "6px 0",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span className="bm-sans" style={{ fontSize: 16, color: INK, fontWeight: 600 }}>
            {label}
          </span>
          {note ? (
            <span className="bm-sans" style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
              {note}
            </span>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          style={{
            marginTop: 8,
            height: 12,
            background: WASH,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            className="bm-metrics-fill"
            style={{
              width: share + "%",
              height: "100%",
              background: VIOLET,
              borderRadius: 999,
              minWidth: count > 0 ? 8 : 0,
            }}
          />
        </div>
      </div>
      <span
        className="bm-sans"
        style={{
          fontSize: 16,
          color: VIOLET_DEEP,
          fontWeight: 600,
          minWidth: 36,
          textAlign: "right",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function RegionChips({ regions }: { regions: MetricsBucket[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        margin: "0 0 18px",
      }}
    >
      {METRICS_REGION_CHIPS.map(function (chip) {
        const row = regions.find(function (item) {
          return item.label === chip.region;
        });
        const count = row ? row.count : 0;
        return (
          <span
            key={chip.region}
            className="bm-sans"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 36,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid " + LINE,
              background: CREAM,
              color: INK,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {chip.label}
            <span style={{ color: VIOLET_DEEP }}>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section
      className="bm-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid " + LINE,
        borderRadius: 22,
        padding: "28px 24px 24px",
        minHeight: 280,
      }}
    >
      <h3 className="bm-serif" style={{ margin: 0, fontSize: 28, fontWeight: 400, color: INK }}>
        {title}
      </h3>
      <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.5, color: MUTED }}>
        {hint}
      </p>
      <GoldRule />
      <div style={{ marginTop: 18 }}>{children}</div>
    </section>
  );
}

function MetricsBoard({
  members,
  regions,
  cities,
  ages,
  unread,
}: {
  members: number;
  regions: MetricsBucket[];
  cities: MetricsBucket[];
  ages: MetricsBucket[];
  unread: boolean;
}) {
  const empty = unread || members === 0;
  const total = unread ? 0 : members;
  const rankedCities = cities.slice().sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    if (a.label === METRICS_UNKNOWN) return 1;
    if (b.label === METRICS_UNKNOWN) return -1;
    return a.label.localeCompare(b.label);
  });
  const ageRows = METRICS_AGE_LABELS.map(function (label) {
    const row = ages.find(function (item) {
      return item.label === label;
    });
    return { label: label, count: row ? row.count : 0 };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <section
        className="bm-card"
        style={{
          position: "relative",
          overflow: "hidden",
          background: CREAM,
          border: "1px solid " + LINE,
          borderRadius: 22,
          padding: "36px 28px 32px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 12% 0%, rgba(109,40,217,.08), transparent 42%), radial-gradient(ellipse at 80% 0%, rgba(196,163,106,.16), transparent 48%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BandhamMark />
              <p className="bm-sans" style={{ margin: 0, fontSize: 12, letterSpacing: ".16em", color: VIOLET, fontWeight: 600 }}>
                {METRICS_KICKER}
              </p>
            </div>
            {empty ? <EmptyMark /> : null}
          </div>
          <p className="bm-serif" style={{ margin: "22px 0 0", fontSize: 64, lineHeight: 0.95, fontWeight: 400, color: VIOLET_DEEP }}>
            {unread ? METRICS_EMPTY_MARK : members}
          </p>
          <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 16, color: INK, fontWeight: 600 }}>
            {METRICS_TOTAL_LABEL}
          </p>
          <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.55, color: MUTED, maxWidth: 520 }}>
            {unread ? METRICS_READ_FAILED : empty ? METRICS_EMPTY_TITLE : METRICS_EMPTY_BODY}
          </p>
          <GoldRule />
        </div>
      </section>

      <div className="bm-metrics-grid">
        <Panel title={METRICS_PLACE_TITLE} hint={METRICS_SHARE_HINT}>
          <RegionChips regions={regions} />
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: ".12em", color: MUTED, fontWeight: 600 }}>
            {METRICS_CITY_TITLE}
          </p>
          {rankedCities.length === 0 ? (
            <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.55, color: MUTED }}>
              {METRICS_EMPTY_CITIES}
            </p>
          ) : (
            rankedCities.map(function (row) {
              const region = placeFromCity(row.label).region;
              const note = region && region !== METRICS_UNKNOWN && region !== row.label ? region : "";
              return <ShareBar key={"city-" + row.label} label={row.label} count={row.count} total={total} note={note} />;
            })
          )}
        </Panel>

        <Panel title={METRICS_AGE_TITLE} hint={METRICS_SHARE_HINT}>
          {ageRows.map(function (row) {
            return <ShareBar key={"age-" + row.label} label={row.label} count={row.count} total={total} />;
          })}
        </Panel>
      </div>
    </div>
  );
}

export default function MetricsView() {
  const [view, setView] = useState<ViewState>({ kind: "closed" });

  useEffect(function () {
    let cancelled = false;
    if (isLocalEmptyPreview()) {
      setView({ kind: "ready", ...FALLBACK });
      return;
    }
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) return Promise.resolve({ ok: false, data: null as MetricsPayload | null });
        return fetch(METRICS_API_PATH, { headers, cache: "no-store" }).then(function (res) {
          return res.json().then(function (data: MetricsPayload) {
            return { ok: res.ok, data };
          });
        });
      })
      .then(function (result) {
        if (cancelled) return;
        if (!result.ok || !result.data) {
          setView({ kind: "closed" });
          return;
        }
        if (result.data.available === false) {
          setView({ kind: "unread" });
          return;
        }
        if (result.data.available !== true) {
          setView({ kind: "closed" });
          return;
        }
        const members = typeof result.data.members === "number" ? result.data.members : 0;
        const regions = asBuckets(result.data.regions);
        const cities = asBuckets(result.data.cities);
        const ages = asBuckets(result.data.ages);
        setView({
          kind: "ready",
          members: members,
          regions: regions.length ? regions : FALLBACK.regions,
          cities: cities,
          ages: ages.length ? ages : FALLBACK.ages,
        });
      })
      .catch(function () {
        if (!cancelled) setView({ kind: "closed" });
      });
    return function () {
      cancelled = true;
    };
  }, []);

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <style>{BOARD_CSS}</style>
      {view.kind === "closed" ? (
        <section
          className="bm-card"
          style={{
            position: "relative",
            overflow: "hidden",
            background: CREAM,
            border: "1px solid " + LINE,
            borderRadius: 22,
            padding: "42px 28px 36px",
          }}
        >
          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 400 }}>
            {METRICS_UNAVAILABLE_TITLE}
          </h2>
          <p className="bm-sans" style={{ margin: 0, fontSize: 16, color: MUTED, lineHeight: 1.55 }}>
            {METRICS_UNAVAILABLE_BODY}
          </p>
        </section>
      ) : (
        <>
          <p className="bm-sans" style={{ fontSize: 12, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
            {METRICS_KICKER}
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 400 }}>
            {METRICS_TITLE}
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 28px", fontSize: 16, color: MUTED, lineHeight: 1.55, maxWidth: 560 }}>
            {METRICS_LEAD}
          </p>
          {view.kind === "unread" ? (
            <MetricsBoard members={0} regions={FALLBACK.regions} cities={[]} ages={FALLBACK.ages} unread />
          ) : (
            <MetricsBoard
              members={view.members}
              regions={view.regions}
              cities={view.cities}
              ages={view.ages}
              unread={false}
            />
          )}
        </>
      )}
    </AppChrome>
  );
}
