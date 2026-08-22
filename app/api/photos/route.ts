import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { runClarityPass } from "../../../lib/photo-process";
import {
  ALLOWED_PHOTO_TYPES,
  PHOTO_MAX_UPLOAD_BYTES,
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_COLUMNS,
} from "../../../lib/profile-photos";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../lib/server-supabase";

export const runtime = "nodejs";

function asFlag(value: FormDataEntryValue | null) {
  if (value == null) return true;
  const text = String(value).toLowerCase();
  return text !== "0" && text !== "false" && text !== "off";
}

function bucketMissing(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("bucket not found") || lower.includes("not found");
}

function storageUrl(supabase: SupabaseClient, path: string, isPublic: boolean) {
  if (isPublic) {
    return supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to upload a photo.");
    }

    const verifier = getServiceSupabase() || getAnonSupabase();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) {
      return unauthorizedResponse(authError || "Sign in to upload a photo.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to store a photo." },
        { status: 500 }
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Send the photo as multipart form data." }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    if (file.size > PHOTO_MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Photo must be 8 MB or smaller." }, { status: 400 });
    }
    if (file.type && !ALLOWED_PHOTO_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP, or AVIF photo. Beauty-filter exports that are not images are rejected." },
        { status: 400 }
      );
    }

    const enhance = asFlag(form.get("enhance"));
    const input = Buffer.from(await file.arrayBuffer());

    let pass;
    try {
      pass = await runClarityPass(input, enhance);
    } catch {
      return NextResponse.json(
        { error: "That file is not a usable photo. Try a JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
    if (bucketListError) {
      return NextResponse.json({ error: bucketListError.message }, { status: 500 });
    }
    const bucket = (buckets || []).find(function (item) {
      return item.name === PROFILE_PHOTO_BUCKET;
    });
    if (!bucket) {
      return NextResponse.json(
        {
          error:
            'Supabase Storage bucket "profile-photos" is not configured. Run supabase/profile_photos.sql in the Supabase SQL editor (or create a bucket named profile-photos).',
          code: "bucket_missing",
          bucket: PROFILE_PHOTO_BUCKET,
        },
        { status: 503 }
      );
    }

    const id = crypto.randomUUID();
    const fullPath = user.id + "/" + id + ".webp";
    const blurPath = user.id + "/" + id + "-blur.webp";

    const fullUpload = await supabase.storage.from(PROFILE_PHOTO_BUCKET).upload(fullPath, pass.enhanced, {
      contentType: pass.contentType,
      upsert: false,
    });
    if (fullUpload.error) {
      if (bucketMissing(fullUpload.error.message)) {
        return NextResponse.json(
          {
            error:
              'Supabase Storage bucket "profile-photos" is not configured. Run supabase/profile_photos.sql in the Supabase SQL editor.',
            code: "bucket_missing",
            bucket: PROFILE_PHOTO_BUCKET,
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: fullUpload.error.message }, { status: 400 });
    }

    const blurUpload = await supabase.storage.from(PROFILE_PHOTO_BUCKET).upload(blurPath, pass.blurred, {
      contentType: pass.contentType,
      upsert: false,
    });
    if (blurUpload.error) {
      return NextResponse.json({ error: blurUpload.error.message }, { status: 400 });
    }

    let photoUrl = storageUrl(supabase, fullPath, bucket.public);
    let blurredUrl = storageUrl(supabase, blurPath, bucket.public);

    if (!photoUrl || !blurredUrl) {
      const signedFull = await supabase.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrl(fullPath, 60 * 60 * 24 * 365);
      const signedBlur = await supabase.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrl(blurPath, 60 * 60 * 24 * 365);
      if (signedFull.error || signedBlur.error || !signedFull.data?.signedUrl || !signedBlur.data?.signedUrl) {
        return NextResponse.json(
          {
            error:
              "The profile-photos bucket exists but is not public, and a signed URL could not be created. Make the bucket public or check Storage policies (see supabase/profile_photos.sql).",
          },
          { status: 503 }
        );
      }
      photoUrl = signedFull.data.signedUrl;
      blurredUrl = signedBlur.data.signedUrl;
    }

    const columnFlags = {
      photo_url: await tableHasColumn(supabase, "profiles", "photo_url"),
      photo_blurred_url: await tableHasColumn(supabase, "profiles", "photo_blurred_url"),
    };

    let profileUpdated = false;
    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (linked && (columnFlags.photo_url || columnFlags.photo_blurred_url)) {
      const existing = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing.data?.id) {
        const patch: Record<string, string> = {};
        if (columnFlags.photo_url) patch.photo_url = photoUrl;
        if (columnFlags.photo_blurred_url) patch.photo_blurred_url = blurredUrl;
        const updated = await supabase.from("profiles").update(patch).eq("id", existing.data.id);
        if (updated.error) {
          return NextResponse.json({ error: updated.error.message }, { status: 400 });
        }
        profileUpdated = true;
      }
    }

    return NextResponse.json({
      success: true,
      photo_url: photoUrl,
      photo_blurred_url: blurredUrl,
      enhance: {
        pass: pass.pass,
        applied: enhance,
        upscaled: pass.upscaled,
        sharpened: pass.sharpened,
        width: pass.width,
        height: pass.height,
        sourceWidth: pass.sourceWidth,
        sourceHeight: pass.sourceHeight,
      },
      profileUpdated,
      linked,
      columns: columnFlags,
      stored: PROFILE_PHOTO_COLUMNS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
