import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { displayInstagramHandle } from "./instagram";
import { revealInstagramHandle } from "./instagram-shares";
import { CREAM, GOLD, INK, LINE, MUTED, VIOLET_DEEP } from "./theme";
import { isVerifyaiVerified } from "./verifyai";

/** User-facing copy. Periods, commas, and existing ellipsis only. No hyphens. */
export const BIODATA_DOWNLOAD_LABEL = "Download biodata";
export const BIODATA_PREPARING_LABEL = "Preparing…";
export const BIODATA_SIGNED_IN_ERROR = "Sign in to download your biodata.";
export const BIODATA_NO_PROFILE_ERROR = "Create a profile first.";
export const BIODATA_FAILED_ERROR = "Could not download your biodata.";
export const BIODATA_PRODUCT = "Bandham AI";
export const BIODATA_TAGLINE = "Find your vibe match?";
export const BIODATA_SHARE_TITLE = "Bandham AI biodata";

export const BIODATA_API_PATH = "/api/profiles/biodata";

/** Columns printed when present. Do not invent religion, caste, family, or age. */
export const BIODATA_BASE_COLUMNS = [
  "id",
  "user_id",
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

export const BIODATA_OPTIONAL_COLUMNS = [
  "photo_url",
  "diet",
  "dob",
  "instagram",
  "verifyai_status",
] as const;

export type BiodataRow = {
  label: string;
  value: string;
};

export type BiodataModel = {
  name: string;
  photoUrl: string;
  verified: boolean;
  instagram: string;
  rows: BiodataRow[];
  about: string;
  wants: string;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hexRgb(hex: string) {
  const raw = hex.replace("#", "");
  return rgb(
    parseInt(raw.slice(0, 2), 16) / 255,
    parseInt(raw.slice(2, 4), 16) / 255,
    parseInt(raw.slice(4, 6), 16) / 255
  );
}

const COLOR_CREAM = hexRgb(CREAM);
const COLOR_GOLD = hexRgb(GOLD);
const COLOR_INK = hexRgb(INK);
const COLOR_LINE = hexRgb(LINE);
const COLOR_MUTED = hexRgb(MUTED);
const COLOR_VIOLET_DEEP = hexRgb(VIOLET_DEEP);

/** Standard PDF fonts are WinAnsi. Drop characters they cannot draw. */
export function winAnsiSafe(value: string) {
  return value
    .replace(/[^\u0000-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayGender(value: unknown) {
  const raw = asText(value);
  if (raw === "M" || raw === "m") return "Male";
  if (raw === "F" || raw === "f") return "Female";
  return raw;
}

/** Age from profiles.dob only. Omit if missing or not a plausible adult age. */
export function ageYearsFromDob(dob: unknown, now = new Date()) {
  let raw = "";
  if (typeof dob === "string") raw = dob.trim();
  else if (dob instanceof Date && !Number.isNaN(dob.getTime())) {
    raw = dob.toISOString().slice(0, 10);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const todayY = now.getUTCFullYear();
  const todayM = now.getUTCMonth() + 1;
  const todayD = now.getUTCDate();
  let age = todayY - year;
  if (todayM < month || (todayM === month && todayD < day)) age -= 1;
  if (age < 18 || age > 120) return "";
  return String(age);
}

export function firstNameSlug(fullName: string) {
  const first = asText(fullName).split(/\s+/)[0] || "";
  const slug = first.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32);
  return slug || "member";
}

export function biodataFilename(fullName: string) {
  return "bandham-biodata-" + firstNameSlug(fullName) + ".pdf";
}

function pushRow(rows: BiodataRow[], label: string, value: string) {
  const safe = winAnsiSafe(value);
  if (!safe) return;
  rows.push({ label, value: safe });
}

/**
 * Biodata rows for a PDF. Instagram uses the existing reveal rule: the owner
 * sees their handle, other people only see it after a share row.
 */
export function profileToBiodataModel(
  row: Record<string, unknown>,
  options: { viewerUserId?: string | null; granted?: boolean; now?: Date }
): BiodataModel {
  const ownerUserId = typeof row.user_id === "string" ? row.user_id : "";
  const instagram = revealInstagramHandle({
    handle: row.instagram,
    viewerUserId: options.viewerUserId || null,
    ownerUserId,
    granted: !!options.granted,
  });

  const rows: BiodataRow[] = [];
  pushRow(rows, "AGE", ageYearsFromDob(row.dob, options.now));
  pushRow(rows, "GENDER", displayGender(row.gender));
  pushRow(rows, "CITY", asText(row.city));
  pushRow(rows, "MOTHER TONGUE", asText(row.mother_tongue));
  pushRow(rows, "VISA STATUS", asText(row.visa_status));
  pushRow(rows, "EDUCATION", asText(row.education));
  pushRow(rows, "PROFESSION", asText(row.profession));
  pushRow(rows, "DIET", asText(row.diet));
  if (instagram) {
    pushRow(rows, "INSTAGRAM", displayInstagramHandle(instagram));
  }

  return {
    name: winAnsiSafe(asText(row.full_name)) || "Profile",
    photoUrl: asText(row.photo_url),
    verified: isVerifyaiVerified(row.verifyai_status),
    instagram,
    rows,
    about: winAnsiSafe(asText(row.about)),
    wants: winAnsiSafe(asText(row.wants)),
  };
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  function flush() {
    if (line) lines.push(line);
    line = "";
  }

  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      continue;
    }
    flush();
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const ch of word) {
      const trial = chunk + ch;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        chunk = trial;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    line = chunk;
  }
  flush();
  return lines;
}

async function embedPhoto(pdf: PDFDocument, jpegBytes?: Uint8Array) {
  if (!jpegBytes || jpegBytes.length === 0) return null;
  try {
    return await pdf.embedJpg(jpegBytes);
  } catch {
    return null;
  }
}

function drawVerifyShield(page: PDFPage, x: number, y: number) {
  page.drawSvgPath(
    "M8 1.2 13.2 3.3v4.1c0 3.3-2.24 6.1-5.2 7-2.96-.9-5.2-3.7-5.2-7V3.3L8 1.2Z",
    { x, y: y - 2, scale: 1.15, color: COLOR_GOLD }
  );
  page.drawSvgPath("M5.3 8.1 7.2 10l3.6-3.8", {
    x,
    y: y - 2,
    scale: 1.15,
    borderColor: rgb(1, 1, 1),
    borderWidth: 1.2,
    borderLineCap: 1,
  });
}

export async function buildBiodataPdf(
  model: BiodataModel,
  photoJpeg?: Uint8Array
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const photo = await embedPhoto(pdf, photoJpeg);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const footerY = 36;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function paintBackground(target: PDFPage) {
    target.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: COLOR_CREAM,
    });
    target.drawRectangle({
      x: 0,
      y: pageHeight - 4,
      width: pageWidth,
      height: 4,
      color: COLOR_GOLD,
    });
    target.drawText(BIODATA_PRODUCT, {
      x: margin,
      y: footerY,
      size: 8,
      font: sans,
      color: COLOR_MUTED,
    });
    const tag = BIODATA_TAGLINE;
    target.drawText(tag, {
      x: pageWidth - margin - sans.widthOfTextAtSize(tag, 8),
      y: footerY,
      size: 8,
      font: sans,
      color: COLOR_MUTED,
    });
  }

  function ensureSpace(needed: number) {
    if (y - needed >= footerY + 18) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    paintBackground(page);
    y = pageHeight - margin;
  }

  paintBackground(page);

  page.drawText(BIODATA_PRODUCT, {
    x: margin,
    y: y - 6,
    size: 20,
    font: serif,
    color: COLOR_INK,
  });
  page.drawText(BIODATA_TAGLINE, {
    x: margin,
    y: y - 22,
    size: 10,
    font: sans,
    color: COLOR_MUTED,
  });
  y -= 36;
  page.drawRectangle({
    x: margin,
    y,
    width: contentWidth,
    height: 0.8,
    color: COLOR_GOLD,
  });
  y -= 22;

  const photoSize = 88;
  const textLeft = photo ? margin + photoSize + 16 : margin;
  const textWidth = photo ? contentWidth - photoSize - 16 : contentWidth;
  const nameSize = 22;
  const name = model.name;
  const nameLines = wrapText(serif, name, nameSize, textWidth - (model.verified ? 22 : 0));
  const headerBlock = Math.max(photo ? photoSize : 0, nameLines.length * 26 + 28);

  ensureSpace(headerBlock + 8);
  const headerTop = y;

  if (photo) {
    page.drawRectangle({
      x: margin - 1,
      y: headerTop - photoSize - 1,
      width: photoSize + 2,
      height: photoSize + 2,
      color: COLOR_LINE,
    });
    page.drawImage(photo, {
      x: margin,
      y: headerTop - photoSize,
      width: photoSize,
      height: photoSize,
    });
  }

  let nameY = headerTop - 16;
  nameLines.forEach(function (line, index) {
    page.drawText(line, {
      x: textLeft,
      y: nameY,
      size: nameSize,
      font: serif,
      color: COLOR_VIOLET_DEEP,
    });
    if (index === 0 && model.verified) {
      const badgeX = textLeft + serif.widthOfTextAtSize(line, nameSize) + 8;
      drawVerifyShield(page, badgeX, nameY - 2);
    }
    nameY -= 26;
  });

  const city = model.rows.find(function (row) {
    return row.label === "CITY";
  })?.value;
  const work = model.rows.find(function (row) {
    return row.label === "PROFESSION";
  })?.value;
  const meta = [city, work].filter(Boolean).join("  ·  ");
  if (meta) {
    wrapText(sans, meta, 11, textWidth).forEach(function (line) {
      page.drawText(line, {
        x: textLeft,
        y: nameY,
        size: 11,
        font: sans,
        color: COLOR_MUTED,
      });
      nameY -= 15;
    });
  }
  if (model.verified) {
    page.drawText("VerifyAI", {
      x: textLeft,
      y: nameY,
      size: 9,
      font: sansBold,
      color: COLOR_GOLD,
    });
  }

  y = headerTop - headerBlock - 16;
  page.drawRectangle({
    x: margin,
    y,
    width: contentWidth,
    height: 0.6,
    color: COLOR_LINE,
  });
  y -= 20;

  const labelWidth = 118;
  const valueWidth = contentWidth - labelWidth;

  model.rows.forEach(function (row) {
    const valueLines = wrapText(sans, row.value, 11, valueWidth);
    const blockHeight = Math.max(16, valueLines.length * 14) + 8;
    ensureSpace(blockHeight);
    page.drawText(row.label, {
      x: margin,
      y: y - 2,
      size: 8,
      font: sansBold,
      color: COLOR_MUTED,
    });
    valueLines.forEach(function (line, index) {
      page.drawText(line, {
        x: margin + labelWidth,
        y: y - 2 - index * 14,
        size: 11,
        font: sans,
        color: COLOR_INK,
      });
    });
    y -= blockHeight;
  });

  function drawSection(title: string, body: string) {
    if (!body) return;
    const lines = wrapText(serif, body, 12, contentWidth);
    ensureSpace(28 + lines.length * 16);
    page.drawText(title, {
      x: margin,
      y,
      size: 8,
      font: sansBold,
      color: COLOR_MUTED,
    });
    y -= 16;
    lines.forEach(function (line) {
      ensureSpace(16);
      page.drawText(line, {
        x: margin,
        y,
        size: 12,
        font: serif,
        color: COLOR_INK,
      });
      y -= 16;
    });
    y -= 10;
  }

  drawSection("ABOUT", model.about);
  drawSection("WANTS", model.wants);

  return pdf.save();
}

export function biodataContentDisposition(filename: string) {
  return 'attachment; filename="' + filename.replace(/"/g, "") + '"';
}
