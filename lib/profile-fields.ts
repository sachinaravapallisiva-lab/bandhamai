import { VISA_STATUS_GROUPS, VISA_STATUS_UNGROUPED } from "./visa-status";

/** Writable text columns already used by POST /api/profiles — do not invent others.
 *  photo_url / photo_blurred_url are attached separately when those columns exist.
 *  instagram is written only when public.profiles.instagram exists (supabase/instagram.sql). */
export const PROFILE_WRITE_FIELDS = [
  "full_name",
  "gender",
  "city",
  "mother_tongue",
  "visa_status",
  "education",
  "profession",
  "about",
  "wants",
  "instagram",
] as const;

/** Optional columns that must not be selected/inserted until tableHasColumn is true. */
export const PROFILE_OPTIONAL_WRITE_FIELDS = ["instagram"] as const;

export type ProfileWriteField = (typeof PROFILE_WRITE_FIELDS)[number];

export type ProfileWritePayload = Record<ProfileWriteField, string>;

export function emptyProfileForm(): ProfileWritePayload {
  return {
    full_name: "",
    gender: "",
    city: "",
    mother_tongue: "",
    visa_status: "",
    education: "",
    profession: "",
    about: "",
    wants: "",
    instagram: "",
  };
}

export type ProfileFieldKind = "text" | "select" | "textarea";

export type ProfileSelectOption = {
  value: string;
  label: string;
};

export type ProfileFieldOption = string | ProfileSelectOption;

export type ProfileFieldOptionGroup = {
  heading: string;
  options: string[];
};

/** Stored values for public.profiles.gender (`CHECK (gender = ANY (ARRAY['M','F']))`). */
export const PROFILE_GENDER_CODES = ["M", "F"] as const;

export type ProfileGenderCode = (typeof PROFILE_GENDER_CODES)[number];

/** Form values are M/F; labels stay human-readable. Other is not a stored gender. */
export const PROFILE_GENDER_OPTIONS: ProfileSelectOption[] = [
  { value: "F", label: "Female" },
  { value: "M", label: "Male" },
];

export const PROFILE_GENDER_ERROR = "Please choose Male or Female.";

export function selectOptionValue(option: ProfileFieldOption) {
  return typeof option === "string" ? option : option.value;
}

export function selectOptionLabel(option: ProfileFieldOption) {
  return typeof option === "string" ? option : option.label;
}

/** Map common UI/API inputs to the stored M/F code. Other and unknown values are invalid. */
export function normalizeProfileGender(value: unknown): ProfileGenderCode | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (key === "m" || key === "male") return "M";
  if (key === "f" || key === "female") return "F";
  return null;
}

export const PROFILE_FORM_FIELDS: {
  key: ProfileWriteField;
  label: string;
  hint?: string;
  placeholder: string;
  required?: boolean;
  kind: ProfileFieldKind;
  options?: ProfileFieldOption[];
  optionGroups?: ProfileFieldOptionGroup[];
}[] = [
  {
    key: "full_name",
    label: "FULL NAME",
    placeholder: "As you want it shown",
    required: true,
    kind: "text",
  },
  {
    key: "gender",
    label: "GENDER",
    placeholder: "Select",
    required: true,
    kind: "select",
    options: PROFILE_GENDER_OPTIONS,
  },
  {
    key: "city",
    label: "CITY",
    placeholder: "Hyderabad",
    required: true,
    kind: "text",
  },
  {
    key: "mother_tongue",
    label: "MOTHER TONGUE",
    placeholder: "Telugu",
    kind: "text",
  },
  {
    key: "visa_status",
    label: "VISA STATUS",
    placeholder: "Select visa status",
    hint: "Grouped by country. Choose the status that fits.",
    kind: "select",
    optionGroups: VISA_STATUS_GROUPS,
    options: [...VISA_STATUS_UNGROUPED],
  },
  {
    key: "education",
    label: "EDUCATION",
    placeholder: "MBBS, B.Tech…",
    kind: "text",
  },
  {
    key: "profession",
    label: "PROFESSION",
    placeholder: "Paediatrician",
    kind: "text",
  },
  {
    key: "about",
    label: "ABOUT",
    hint: "A few lines in your own words.",
    placeholder: "Who you are, how you live.",
    kind: "textarea",
  },
  {
    key: "wants",
    label: "WANTS",
    hint: "What you hope to find.",
    placeholder: "A doctor in Hyderabad, vegetarian, near family…",
    kind: "textarea",
  },
];

export const REQUIRED_PROFILE_FIELDS: ProfileWriteField[] = ["full_name", "gender", "city"];
