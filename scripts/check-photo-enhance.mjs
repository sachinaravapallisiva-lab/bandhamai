import sharp from "sharp";

const tiny = await sharp({
  create: { width: 40, height: 30, channels: 3, background: { r: 109, g: 40, b: 217 } },
}).png().toBuffer();

const { data, info } = await sharp(tiny, { failOn: "none" })
  .rotate()
  .resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: false,
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.8, m1: 0.55, m2: 0.25 })
  .webp({ quality: 82, effort: 4 })
  .toBuffer({ resolveWithObject: true });

if (Math.max(info.width, info.height) !== 1600) {
  throw new Error("expected 1600px longest side, got " + info.width + "x" + info.height);
}

const blur = await sharp(data).resize({ width: 24, height: 24, fit: "inside" }).blur(12).webp({ quality: 36 }).toBuffer();
const blurMeta = await sharp(blur).metadata();
if ((blurMeta.width || 99) > 24 || (blurMeta.height || 99) > 24) {
  throw new Error("blur derivative should be <= 24px, got " + blurMeta.width + "x" + blurMeta.height);
}

console.log("clarity/resolution pass ok", {
  enhanced: info.width + "x" + info.height,
  blur: blurMeta.width + "x" + blurMeta.height,
  bytes: data.length,
});
