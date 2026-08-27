import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { biodataFilename, buildBiodataPdf, profileToBiodataModel } from "../lib/biodata.ts";

const now = new Date(Date.UTC(2026, 7, 24));
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts");
mkdirSync(outDir, { recursive: true });

const full = profileToBiodataModel(
  {
    id: "sample",
    user_id: "owner",
    full_name: "Ananya Reddy",
    gender: "F",
    city: "Hyderabad",
    mother_tongue: "Telugu",
    visa_status: "Citizen, India",
    education: "B.Tech",
    profession: "Software engineer",
    diet: "Vegetarian",
    about: "Hyderabad raised Telugu family. Work in tech, weekends with parents and cousins. Looking for a serious matrimony match.",
    wants: "Telugu or South Indian, vegetarian preferred, open to Hyderabad or Bangalore after marriage.",
    dob: "1996-03-12",
    instagram: "ananya",
    verifyai_status: "verified",
    photo_url: "https://example.supabase.co/storage/v1/object/public/profile-photos/owner/a.webp",
  },
  { viewerUserId: "owner", now }
);

const empty = profileToBiodataModel(
  { id: "empty", user_id: "owner", full_name: "Ananya Reddy" },
  { viewerUserId: "owner", now }
);

const photoJpeg = new Uint8Array(
  await sharp({
    create: {
      width: 480,
      height: 480,
      channels: 3,
      background: { r: 196, g: 176, b: 214 },
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer()
);

const withPhoto = await buildBiodataPdf(full, photoJpeg);
const withoutPhoto = await buildBiodataPdf(full);
const sparse = await buildBiodataPdf(empty);

const named = join(outDir, biodataFilename(full.name));
const fullPath = join(outDir, "biodata-sample.pdf");
const noPhotoPath = join(outDir, "biodata-sample-no-photo.pdf");
const sparsePath = join(outDir, "biodata-sample-empty.pdf");

writeFileSync(named, withPhoto);
writeFileSync(fullPath, withPhoto);
writeFileSync(noPhotoPath, withoutPhoto);
writeFileSync(sparsePath, sparse);

console.log("wrote biodata samples", {
  withPhoto: fullPath,
  named,
  noPhoto: noPhotoPath,
  empty: sparsePath,
  bytes: withPhoto.length,
});
