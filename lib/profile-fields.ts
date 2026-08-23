import { VISA_STATUS_GROUPS, VISA_STATUS_UNGROUPED } from "./visa-status";

/** Writable text columns already used by POST /api/profiles — do not invent others.
 *  photo_url / photo_blurred_url are attached separately when those columns exist. */
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
] as const;

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
  };
}

export type ProfileFieldKind = "text" | "select" | "textarea";

export type ProfileFieldOptionGroup = {
  heading: string;
  options: string[];
};

export const PROFILE_FORM_FIELDS: {
  key: ProfileWriteField;
  label: string;
  hint?: string;
  placeholder: string;
  required?: boolean;
  kind: ProfileFieldKind;
  options?: string[];
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
    options: ["Female", "Male", "Other"],
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
