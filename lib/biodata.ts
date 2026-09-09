import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { displayInstagramHandle } from "./instagram";
import { revealInstagramHandle } from "./instagram-shares";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "./theme";
import { isVerifyaiVerified, VERIFYAI_COPY } from "./verifyai";

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
export const BIODATA_SECTION_DETAILS = "DETAILS";
export const BIODATA_SECTION_ABOUT = "ABOUT";
export const BIODATA_SECTION_LOOKING = "LOOKING FOR";
export const BIODATA_VERIFIED_LABEL = VERIFYAI_COPY.badgeLabel;
export const BIODATA_VERIFYAI_MARK = "VerifyAI";

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
const COLOR_INK = hexRgb(INK);
const COLOR_LINE = hexRgb(LINE);
const COLOR_MUTED = hexRgb(MUTED);
const COLOR_VIOLET = hexRgb(VIOLET);
const COLOR_VIOLET_DEEP = hexRgb(VIOLET_DEEP);
const COLOR_WASH = hexRgb(WASH);
const COLOR_WHITE = rgb(1, 1, 1);

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

/** Violet shield + white check. Same mark as the web VerifyBadge, not gold or a tick. */
function drawVerifyShield(page: PDFPage, x: number, y: number, scale = 1.2) {
  page.drawSvgPath(
    "M8 1.2 13.2 3.3v4.1c0 3.3-2.24 6.1-5.2 7-2.96-.9-5.2-3.7-5.2-7V3.3L8 1.2Z",
    { x, y: y - 2, scale, color: COLOR_VIOLET }
  );
  page.drawSvgPath("M5.3 8.1 7.2 10l3.6-3.8", {
    x,
    y: y - 2,
    scale,
    borderColor: COLOR_WHITE,
    borderWidth: 1.2,
    borderLineCap: 1,
  });
}

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

export async function buildBiodataPdf(
  model: BiodataModel,
  photoJpeg?: Uint8Array
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const photo = await embedPhoto(pdf, photoJpeg);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const footerY = 38;
  const rail = 2.75;
  const cardPad = 14;
  const photoSize = 108;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 32;

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
      y: pageHeight - 3.25,
      width: pageWidth,
      height: 3.25,
      color: COLOR_VIOLET,
    });
    target.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 3.25,
      color: COLOR_VIOLET,
    });
    target.drawRectangle({
      x: 16,
      y: 16,
      width: pageWidth - 32,
      height: pageHeight - 32,
      borderColor: COLOR_LINE,
      borderWidth: 0.75,
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
    if (y - needed >= footerY + 22) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    paintBackground(page);
    y = pageHeight - 32;
  }

  function drawCardShell(top: number, height: number) {
    page.drawRectangle({
      x: margin,
      y: top - height,
      width: contentWidth,
      height,
      color: COLOR_WASH,
    });
    page.drawRectangle({
      x: margin,
      y: top - height,
      width: contentWidth,
      height,
      borderColor: COLOR_LINE,
      borderWidth: 0.7,
    });
    page.drawRectangle({
      x: margin,
      y: top - height,
      width: rail,
      height,
      color: COLOR_VIOLET,
    });
  }

  function drawSectionTitle(title: string, top: number) {
    page.drawText(title, {
      x: margin + cardPad,
      y: top - 16,
      size: 8,
      font: sansBold,
      color: COLOR_MUTED,
    });
    page.drawRectangle({
      x: margin + cardPad,
      y: top - 22,
      width: contentWidth - cardPad * 2,
      height: 0.6,
      color: COLOR_LINE,
    });
  }

  paintBackground(page);

  page.drawText(BIODATA_PRODUCT, {
    x: margin,
    y: y - 4,
    size: 13,
    font: serifBold,
    color: COLOR_INK,
  });
  const tagWidth = sans.widthOfTextAtSize(BIODATA_TAGLINE, 8);
  page.drawText(BIODATA_TAGLINE, {
    x: pageWidth - margin - tagWidth,
    y: y - 2,
    size: 8,
    font: sans,
    color: COLOR_MUTED,
  });
  y -= 16;
  page.drawRectangle({
    x: margin,
    y,
    width: contentWidth,
    height: 1.15,
    color: COLOR_VIOLET,
  });
  y -= 16;

  const nameSize = 24;
  const textLeft = margin + cardPad + photoSize + 16;
  const textWidth = contentWidth - cardPad * 2 - photoSize - 16;
  const nameLines = wrapText(serifBold, model.name, nameSize, textWidth);
  const city = model.rows.find(function (row) {
    return row.label === "CITY";
  })?.value;
  const work = model.rows.find(function (row) {
    return row.label === "PROFESSION";
  })?.value;
  const meta = [city, work].filter(Boolean).join("  ·  ");
  const metaLines = meta ? wrapText(sans, meta, 10.5, textWidth) : [];
  const verifiedBlock = model.verified ? 28 : 0;
  const textBlock = nameLines.length * 26 + metaLines.length * 14 + verifiedBlock;
  const headerInner = Math.max(photoSize, textBlock);
  const headerH = headerInner + cardPad * 2;
  const textShift = (headerInner - textBlock) / 2;

  ensureSpace(headerH + 8);
  const headerTop = y;
  drawCardShell(headerTop, headerH);

  const photoX = margin + cardPad;
  const photoY = headerTop - cardPad - photoSize;
  page.drawRectangle({
    x: photoX - 1,
    y: photoY - 1,
    width: photoSize + 2,
    height: photoSize + 2,
    color: COLOR_LINE,
  });
  if (photo) {
    page.drawImage(photo, {
      x: photoX,
      y: photoY,
      width: photoSize,
      height: photoSize,
    });
  } else {
    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoSize,
      height: photoSize,
      color: COLOR_CREAM,
    });
    const initials = profileInitials(model.name);
    if (initials) {
      const initialSize = 30;
      page.drawText(initials, {
        x: photoX + (photoSize - serifBold.widthOfTextAtSize(initials, initialSize)) / 2,
        y: photoY + photoSize / 2 - 10,
        size: initialSize,
        font: serifBold,
        color: COLOR_VIOLET,
      });
    }
  }

  let nameY = headerTop - cardPad - textShift - 16;
  nameLines.forEach(function (line) {
    page.drawText(line, {
      x: textLeft,
      y: nameY,
      size: nameSize,
      font: serifBold,
      color: COLOR_VIOLET_DEEP,
    });
    nameY -= 26;
  });
  metaLines.forEach(function (line) {
    page.drawText(line, {
      x: textLeft,
      y: nameY,
      size: 10.5,
      font: sans,
      color: COLOR_MUTED,
    });
    nameY -= 14;
  });
  if (model.verified) {
    const badgeY = nameY - 2;
    drawVerifyShield(page, textLeft, badgeY, 1.25);
    page.drawText(BIODATA_VERIFIED_LABEL, {
      x: textLeft + 21,
      y: badgeY + 6,
      size: 10,
      font: sansBold,
      color: COLOR_VIOLET_DEEP,
    });
    page.drawText(BIODATA_VERIFYAI_MARK, {
      x: textLeft + 21,
      y: badgeY - 6,
      size: 7,
      font: sans,
      color: COLOR_VIOLET,
    });
  }

  y = headerTop - headerH - 12;

  const gutter = 22;
  const colWidth = (contentWidth - cardPad * 2 - gutter) / 2;
  const labelSize = 7;
  const valueSize = 12;
  const valueGap = 14;

  function factHeight(row: BiodataRow) {
    return 10 + Math.max(1, wrapText(serif, row.value, valueSize, colWidth).length) * valueGap + 6;
  }

  if (model.rows.length) {
    const leftRows: BiodataRow[] = [];
    const rightRows: BiodataRow[] = [];
    model.rows.forEach(function (row, index) {
      if (index % 2 === 0) leftRows.push(row);
      else rightRows.push(row);
    });
    const pairCount = Math.max(leftRows.length, rightRows.length);
    let factsInner = 26;
    for (let i = 0; i < pairCount; i += 1) {
      factsInner += Math.max(
        leftRows[i] ? factHeight(leftRows[i]) : 0,
        rightRows[i] ? factHeight(rightRows[i]) : 0
      );
    }
    const factsH = factsInner + cardPad;
    ensureSpace(factsH + 8);
    const factsTop = y;
    drawCardShell(factsTop, factsH);
    drawSectionTitle(BIODATA_SECTION_DETAILS, factsTop);

    let rowY = factsTop - 30;
    const leftX = margin + cardPad;
    const rightX = leftX + colWidth + gutter;
    for (let i = 0; i < pairCount; i += 1) {
      const left = leftRows[i];
      const right = rightRows[i];
      const rowH = Math.max(left ? factHeight(left) : 0, right ? factHeight(right) : 0);
      if (i > 0) {
        page.drawRectangle({
          x: margin + cardPad,
          y: rowY + 8,
          width: contentWidth - cardPad * 2,
          height: 0.45,
          color: COLOR_LINE,
        });
      }
      function drawFact(row: BiodataRow | undefined, x: number) {
        if (!row) return;
        page.drawText(row.label, {
          x,
          y: rowY,
          size: labelSize,
          font: sansBold,
          color: COLOR_MUTED,
        });
        wrapText(serif, row.value, valueSize, colWidth).forEach(function (line, lineIndex) {
          page.drawText(line, {
            x,
            y: rowY - 14 - lineIndex * valueGap,
            size: valueSize,
            font: serif,
            color: COLOR_INK,
          });
        });
      }
      drawFact(left, leftX);
      drawFact(right, rightX);
      rowY -= rowH;
    }
    y = factsTop - factsH - 12;
  }

  function drawNarrative(title: string, body: string) {
    if (!body) return;
    const innerWidth = contentWidth - cardPad * 2;
    const lines = wrapText(serif, body, 12, innerWidth);
    let index = 0;
    while (index < lines.length) {
      const headerNeed = 36;
      if (y - (footerY + 22) < headerNeed + 16) {
        ensureSpace(headerNeed + 48);
      }
      const room = y - (footerY + 22);
      const maxLines = Math.max(1, Math.floor((room - 36 - cardPad) / 16));
      const chunk = lines.slice(index, index + maxLines);
      const cardH = 28 + chunk.length * 16 + cardPad;
      const top = y;
      drawCardShell(top, cardH);
      drawSectionTitle(title, top);
      let lineY = top - 36;
      chunk.forEach(function (line) {
        page.drawText(line, {
          x: margin + cardPad,
          y: lineY,
          size: 12,
          font: serif,
          color: COLOR_INK,
        });
        lineY -= 16;
      });
      y = top - cardH - 12;
      index += chunk.length;
    }
  }

  drawNarrative(BIODATA_SECTION_ABOUT, model.about);
  drawNarrative(BIODATA_SECTION_LOOKING, model.wants);

  return pdf.save();
}

export function biodataContentDisposition(filename: string) {
  return 'attachment; filename="' + filename.replace(/"/g, "") + '"';
}
