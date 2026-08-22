import sharp from "sharp";
import { PHOTO_MAX_SIDE } from "./profile-photos";

export type ClarityPass = {
  enhanced: Buffer;
  blurred: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  upscaled: boolean;
  sharpened: boolean;
  /** Product name for this step — resolution/clarity only, never beauty/face rewrite. */
  pass: "clarity/resolution";
};

/**
 * Clarity / resolution pass (not beauty, not face morphing).
 *
 * When `enhance` is true:
 *   EXIF rotate → Lanczos fit to 1600px longest side (upscale small photos) →
 *   mild unsharp → WebP quality normalize.
 *
 * When `enhance` is false:
 *   EXIF rotate → fit inside 1600 without enlarging → WebP compress.
 *
 * Always also writes a heavily downscaled + blurred derivative for
 * blur-until-matched. CSS blur is not used for storage.
 */
export async function runClarityPass(input: Buffer, enhance: boolean): Promise<ClarityPass> {
  const oriented = sharp(input, { failOn: "none", unlimited: false }).rotate();
  const meta = await oriented.metadata();
  const sourceWidth = meta.width || 0;
  const sourceHeight = meta.height || 0;
  const longest = Math.max(sourceWidth, sourceHeight);

  let pipeline = oriented.resize({
    width: PHOTO_MAX_SIDE,
    height: PHOTO_MAX_SIDE,
    fit: "inside",
    withoutEnlargement: !enhance,
    kernel: sharp.kernel.lanczos3,
  });

  if (enhance) {
    // Mild unsharp for perceived sharpness after resample. No skin smoothing,
    // no color grading, no face detection.
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.55, m2: 0.25 });
  }

  const { data, info } = await pipeline.webp({ quality: enhance ? 82 : 80, effort: 4 }).toBuffer({
    resolveWithObject: true,
  });

  const blurred = await sharp(data)
    .resize({ width: 24, height: 24, fit: "inside" })
    .blur(12)
    .webp({ quality: 36, effort: 3 })
    .toBuffer();

  return {
    enhanced: data,
    blurred,
    contentType: "image/webp",
    width: info.width,
    height: info.height,
    sourceWidth,
    sourceHeight,
    upscaled: enhance && longest > 0 && longest < PHOTO_MAX_SIDE,
    sharpened: enhance,
    pass: "clarity/resolution",
  };
}
