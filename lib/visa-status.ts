/**
 * NRI / diaspora visa status for profile create.
 * Headings are UI only. The chosen option label is stored as profiles.visa_status.
 * No extra columns. UK stays a flat list until that group grows past ~8 options.
 */

export type VisaStatusGroup = {
  heading: string;
  options: string[];
};

export const VISA_STATUS_GROUPS: VisaStatusGroup[] = [
  {
    heading: "United States",
    options: [
      "US Citizen",
      "Green Card (LPR)",
      "H-1B",
      "F-1 / OPT / STEM OPT",
      "L-1",
      "Other US status",
    ],
  },
  {
    heading: "United Kingdom",
    options: [
      "UK Citizen",
      "ILR / Settled status",
      "Skilled Worker",
      "Student (UK)",
      "Other UK status",
    ],
  },
  {
    heading: "Australia",
    options: [
      "Australian Citizen",
      "Permanent Resident (AU)",
      "Temporary skilled (AU)",
      "Student (AU)",
      "Other AU status",
    ],
  },
  {
    heading: "Europe (EU/EEA)",
    options: [
      "EU/EEA Citizen",
      "Permanent / long-term EU resident",
      "Work visa (EU)",
      "Student (EU)",
      "Other EU status",
    ],
  },
  {
    heading: "Ireland",
    options: [
      "Irish Citizen",
      "Stamp 4 / long-term resident",
      "Critical Skills / work permission",
      "Student (IE)",
      "Other Ireland status",
    ],
  },
];

/** Small ungrouped tail: not a country heading. */
export const VISA_STATUS_UNGROUPED = ["Indian citizen (living abroad)", "Prefer not to say"] as const;

export const VISA_STATUS_OPTIONS: string[] = VISA_STATUS_GROUPS.flatMap(function (group) {
  return group.options;
}).concat(VISA_STATUS_UNGROUPED);

const OPTION_SET = new Set(
  VISA_STATUS_OPTIONS.map(function (label) {
    return label.toLowerCase();
  })
);

/** Typed Browse shorthand → stored option label (or a distinctive fragment of it). */
export const VISA_STATUS_ALIASES: Record<string, string> = {
  h1b: "H-1B",
  "h-1b": "H-1B",
  "h 1b": "H-1B",
  "h1-b": "H-1B",
  "h1 b": "H-1B",
  f1: "F-1 / OPT / STEM OPT",
  "f-1": "F-1 / OPT / STEM OPT",
  "f 1": "F-1 / OPT / STEM OPT",
  opt: "F-1 / OPT / STEM OPT",
  "stem opt": "F-1 / OPT / STEM OPT",
  stemopt: "F-1 / OPT / STEM OPT",
  l1: "L-1",
  "l-1": "L-1",
  "l 1": "L-1",
  "green card": "Green Card (LPR)",
  greencard: "Green Card (LPR)",
  gc: "Green Card (LPR)",
  "gc holder": "Green Card (LPR)",
  lpr: "Green Card (LPR)",
  "lawful permanent resident": "Green Card (LPR)",
  "us citizen": "US Citizen",
  "u s citizen": "US Citizen",
  "american citizen": "US Citizen",
  "uk citizen": "UK Citizen",
  "british citizen": "UK Citizen",
  ilr: "ILR / Settled status",
  "settled status": "ILR / Settled status",
  "indefinite leave": "ILR / Settled status",
  "skilled worker": "Skilled Worker",
  "skilled worker visa": "Skilled Worker",
  "australian citizen": "Australian Citizen",
  "au citizen": "Australian Citizen",
  "pr au": "Permanent Resident (AU)",
  "irish citizen": "Irish Citizen",
  "stamp 4": "Stamp 4 / long-term resident",
  stamp4: "Stamp 4 / long-term resident",
  "critical skills": "Critical Skills / work permission",
  "eu citizen": "EU/EEA Citizen",
  "eea citizen": "EU/EEA Citizen",
  "indian citizen": "Indian citizen (living abroad)",
  "indian passport": "Indian citizen (living abroad)",
};

function compactVisa(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function isVisaStatusOption(value: string) {
  return OPTION_SET.has(value.trim().toLowerCase());
}

export function resolveVisaAlias(value: string) {
  const key = value.toLowerCase().trim();
  return VISA_STATUS_ALIASES[key] || "";
}

/** ILIKE / score variants so H1B still hits stored H-1B (and the reverse). */
export function visaKeywordVariants(keyword: string): string[] {
  const raw = keyword.trim();
  if (!raw) return [];
  const values: string[] = [];
  function add(value: string) {
    if (!value) return;
    const seen = values.some(function (item) {
      return item.toLowerCase() === value.toLowerCase();
    });
    if (seen) return;
    values.push(value);
  }
  add(raw);
  const mapped = resolveVisaAlias(raw);
  if (mapped) add(mapped);
  const folded = raw.replace(/[^a-zA-Z0-9]+/g, "");
  if (folded && folded.toLowerCase() !== raw.toLowerCase()) add(folded);
  if (mapped) {
    const mappedFolded = mapped.replace(/[^a-zA-Z0-9]+/g, "");
    if (mappedFolded && mappedFolded.toLowerCase() !== mapped.toLowerCase()) add(mappedFolded);
  }
  return values.slice(0, 6);
}

export function visaLooksLike(visa: string, keyword: string) {
  const stored = visa.trim();
  const needle = keyword.trim();
  if (!stored || !needle) return false;
  if (stored.toLowerCase().includes(needle.toLowerCase())) return true;
  const storedCompact = compactVisa(stored);
  const needleCompact = compactVisa(needle);
  if (needleCompact.length >= 2 && storedCompact.includes(needleCompact)) return true;
  const mapped = resolveVisaAlias(needle);
  if (mapped) {
    if (stored.toLowerCase() === mapped.toLowerCase()) return true;
    if (stored.toLowerCase().includes(mapped.toLowerCase())) return true;
    const mappedCompact = compactVisa(mapped);
    if (mappedCompact.length >= 2 && storedCompact.includes(mappedCompact)) return true;
  }
  return false;
}
