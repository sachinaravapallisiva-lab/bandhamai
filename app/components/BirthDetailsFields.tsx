"use client";

import { GUN_MILAN_CHOOSE_PLACE } from "../../lib/gun-milan";
import {
  BIRTH_DATE_LABEL,
  BIRTH_LAT_LABEL,
  BIRTH_LON_LABEL,
  BIRTH_PLACE_LABEL,
  BIRTH_PLACE_PRESET_LABEL,
  BIRTH_PLACE_PRESETS,
  BIRTH_SECTION_HINT,
  BIRTH_SECTION_TITLE,
  BIRTH_TIME_LABEL,
  BIRTH_TIME_ZONES,
  BIRTH_TZ_LABEL,
  emptyBirthDetails,
  findBirthPlacePreset,
  type BirthDetailsFields,
} from "../../lib/birth-details";
import { INK, LINE, MUTED, WASH } from "../../lib/theme";

const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid " + LINE,
  borderRadius: 10,
  fontSize: 14,
  color: INK,
  background: WASH,
  boxSizing: "border-box" as const,
};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="bm-sans"
      style={{
        display: "block",
        margin: "0 0 6px",
        fontSize: 9.5,
        letterSpacing: ".14em",
        color: MUTED,
      }}
    >
      {children}
    </label>
  );
}

export default function BirthDetailsFields({
  value,
  onChange,
  disabled,
  idPrefix = "birth",
}: {
  value: BirthDetailsFields;
  onChange: (next: BirthDetailsFields) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const form = value || emptyBirthDetails();

  function patch(partial: Partial<BirthDetailsFields>) {
    onChange({ ...form, ...partial });
  }

  return (
    <div>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400 }}>
        {BIRTH_SECTION_TITLE}
      </h3>
      <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {BIRTH_SECTION_HINT}
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <FieldLabel htmlFor={idPrefix + "-preset"}>{BIRTH_PLACE_PRESET_LABEL}</FieldLabel>
          <select
            id={idPrefix + "-preset"}
            disabled={disabled}
            defaultValue=""
            onChange={function (e) {
              const preset = findBirthPlacePreset(e.target.value);
              if (!preset) return;
              patch({
                place_name: preset.place_name,
                latitude: preset.latitude,
                longitude: preset.longitude,
                timezone: preset.timezone,
              });
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          >
            <option value="">{GUN_MILAN_CHOOSE_PLACE}</option>
            {BIRTH_PLACE_PRESETS.map(function (place) {
              return (
                <option key={place.id} value={place.id}>
                  {place.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor={idPrefix + "-date"}>{BIRTH_DATE_LABEL}</FieldLabel>
          <input
            id={idPrefix + "-date"}
            type="date"
            value={form.birth_date}
            disabled={disabled}
            onChange={function (e) {
              patch({ birth_date: e.target.value });
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          />
        </div>

        <div>
          <FieldLabel htmlFor={idPrefix + "-time"}>{BIRTH_TIME_LABEL}</FieldLabel>
          <input
            id={idPrefix + "-time"}
            type="time"
            step={60}
            value={form.birth_time.slice(0, 5)}
            disabled={disabled}
            onChange={function (e) {
              patch({ birth_time: e.target.value });
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          />
        </div>

        <div>
          <FieldLabel htmlFor={idPrefix + "-place"}>{BIRTH_PLACE_LABEL}</FieldLabel>
          <input
            id={idPrefix + "-place"}
            value={form.place_name}
            disabled={disabled}
            onChange={function (e) {
              patch({ place_name: e.target.value });
            }}
            placeholder="Hyderabad"
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <FieldLabel htmlFor={idPrefix + "-lat"}>{BIRTH_LAT_LABEL}</FieldLabel>
            <input
              id={idPrefix + "-lat"}
              value={form.latitude}
              disabled={disabled}
              onChange={function (e) {
                patch({ latitude: e.target.value });
              }}
              inputMode="decimal"
              placeholder="17.3850"
              className="bm-sans bm-input bm-focus"
              style={fieldStyle}
            />
          </div>
          <div>
            <FieldLabel htmlFor={idPrefix + "-lon"}>{BIRTH_LON_LABEL}</FieldLabel>
            <input
              id={idPrefix + "-lon"}
              value={form.longitude}
              disabled={disabled}
              onChange={function (e) {
                patch({ longitude: e.target.value });
              }}
              inputMode="decimal"
              placeholder="78.4867"
              className="bm-sans bm-input bm-focus"
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor={idPrefix + "-tz"}>{BIRTH_TZ_LABEL}</FieldLabel>
          <select
            id={idPrefix + "-tz"}
            value={form.timezone}
            disabled={disabled}
            onChange={function (e) {
              patch({ timezone: e.target.value });
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          >
            {BIRTH_TIME_ZONES.map(function (zone) {
              return (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
