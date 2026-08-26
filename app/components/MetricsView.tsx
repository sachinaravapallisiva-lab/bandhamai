"use client";

import { useEffect, useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import {
  METRICS_AGE_TITLE,
  METRICS_API_PATH,
  METRICS_CITY_TITLE,
  METRICS_EMPTY_BODY,
  METRICS_EMPTY_TITLE,
  METRICS_KICKER,
  METRICS_LEAD,
  METRICS_PLACE_TITLE,
  METRICS_READ_FAILED,
  METRICS_REGION_TITLE,
  METRICS_TITLE,
  METRICS_TOTAL_LABEL,
  METRICS_UNAVAILABLE_BODY,
  METRICS_UNAVAILABLE_TITLE,
  emptyMemberMetrics,
  type MetricsBucket,
} from "../../lib/metrics";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "./AppChrome";

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

function CountRow({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(92px, 38%) minmax(0, 1fr) 44px",
        gap: 10,
        alignItems: "center",
        minHeight: 36,
      }}
    >
      <span className="bm-sans" style={{ fontSize: 14, color: INK, fontWeight: 600 }}>
        {label}
      </span>
      <div
        aria-hidden="true"
        style={{
          height: 10,
          background: WASH,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: width + "%",
            height: "100%",
            background: VIOLET,
            borderRadius: 999,
            minWidth: count > 0 ? 6 : 0,
          }}
        />
      </div>
      <span className="bm-sans" style={{ fontSize: 14, color: VIOLET_DEEP, fontWeight: 600, textAlign: "right" }}>
        {count}
      </span>
    </div>
  );
}

function BucketList({ title, buckets }: { title: string; buckets: MetricsBucket[] }) {
  const max = buckets.reduce(function (high, row) {
    return row.count > high ? row.count : high;
  }, 0);
  return (
    <section
      className="bm-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "20px 18px",
      }}
    >
      <h3 className="bm-serif" style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 400, color: INK }}>
        {title}
      </h3>
      {buckets.length === 0 ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED }}>
          {METRICS_EMPTY_BODY}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {buckets.map(function (row) {
            return <CountRow key={title + row.label} label={row.label} count={row.count} max={max} />;
          })}
        </div>
      )}
    </section>
  );
}

const FALLBACK = emptyMemberMetrics();

export default function MetricsView() {
  const [view, setView] = useState<ViewState>({ kind: "closed" });

  useEffect(function () {
    let cancelled = false;
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

  if (view.kind === "closed") {
    return (
      <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
        <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
          {METRICS_UNAVAILABLE_TITLE}
        </h2>
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          {METRICS_UNAVAILABLE_BODY}
        </p>
      </AppChrome>
    );
  }

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {METRICS_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {METRICS_TITLE}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {METRICS_LEAD}
      </p>

      {view.kind === "unread" ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          {METRICS_READ_FAILED}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section
            className="bm-card"
            style={{
              background: CREAM,
              border: "1px solid " + LINE,
              borderRadius: 14,
              padding: "20px 18px",
            }}
          >
            <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 12, letterSpacing: ".12em", color: MUTED }}>
              {METRICS_TOTAL_LABEL}
            </p>
            <p className="bm-serif" style={{ margin: 0, fontSize: 40, fontWeight: 400, color: VIOLET_DEEP }}>
              {view.members}
            </p>
            <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              {view.members === 0 ? METRICS_EMPTY_TITLE : METRICS_EMPTY_BODY}
            </p>
          </section>

          <p className="bm-serif" style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 400 }}>
            {METRICS_PLACE_TITLE}
          </p>
          <BucketList title={METRICS_REGION_TITLE} buckets={view.regions} />
          <BucketList title={METRICS_CITY_TITLE} buckets={view.cities} />
          <BucketList title={METRICS_AGE_TITLE} buckets={view.ages} />
        </div>
      )}
    </AppChrome>
  );
}
