import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import {
  PROFILE_GENDER_ERROR,
  PROFILE_OPTIONAL_WRITE_FIELDS,
  PROFILE_WRITE_FIELDS,
  REQUIRED_PROFILE_FIELDS,
  normalizeProfileGender,
  type ProfileWriteField,
} from "../../../lib/profile-fields";
import {
  BIODATA_SHARE_COLUMN,
  BIODATA_SHARE_SQL_HINT,
  parseBiodataShare,
} from "../../../lib/biodata-share";
import { INSTAGRAM_COLUMN, INSTAGRAM_SQL_HINT, parseInstagramInput } from "../../../lib/instagram";
import { isOwnStoredPhotoUrl, PROFILE_PHOTO_REQUIRED_ERROR } from "../../../lib/profile-photos";
import {
  SUBSCRIBE_CALL_LAST_AT_COLUMN,
  SUBSCRIBE_CALL_NEED_PHONE,
  SUBSCRIBE_CALL_OPT_IN_COLUMN,
  SUBSCRIBE_CALL_OPTED_AT_COLUMN,
  SUBSCRIBE_CALL_PHONE_COLUMN,
  SUBSCRIBE_CALL_SQL_HINT,
  normalizeSubscribePhone,
  parseCallSubscribeOptIn,
} from "../../../lib/subscribe-call";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readWriteFields(body: Record<string, unknown>) {
  const row: Partial<Record<ProfileWriteField, string | null>> = {};
  for (const key of PROFILE_WRITE_FIELDS) {
    const value = asString(body[key]);
    row[key] = value || null;
  }
  return row;
}

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to continue.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (!linked) {
      return NextResponse.json({ profile: null, linked: false, user: { id: user.id, email: user.email } });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      profile: data,
      linked: true,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to create a profile.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON profile." }, { status: 400 });
    }

    const fields = readWriteFields(body);
    for (const key of REQUIRED_PROFILE_FIELDS) {
      if (!fields[key]) {
        return NextResponse.json(
          { error: "Please fill in your name, gender, and city." },
          { status: 400 }
        );
      }
    }

    const gender = normalizeProfileGender(fields.gender);
    if (!gender) {
      return NextResponse.json({ error: PROFILE_GENDER_ERROR }, { status: 400 });
    }
    fields.gender = gender;

    const instagram = parseInstagramInput(fields.instagram);
    if (instagram.error) {
      return NextResponse.json({ error: instagram.error }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) {
      return unauthorizedResponse(authError || "Sign in to create a profile.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a profile." },
        { status: 500 }
      );
    }

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (linked) {
      const existing = await supabase
        .from("profiles")
        .select("id, status")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        return NextResponse.json({ error: existing.error.message }, { status: 400 });
      }
      if (existing.data) {
        return NextResponse.json(
          {
            error:
              existing.data.status === "pending"
                ? "Your profile is already submitted for review."
                : "You already have a profile.",
            profile: existing.data,
          },
          { status: 409 }
        );
      }
    }

    const insertRow: Record<string, string | boolean | null> = {
      ...fields,
      // Manual approval: never go live from this endpoint.
      status: "pending",
    };
    for (const key of PROFILE_OPTIONAL_WRITE_FIELDS) {
      delete insertRow[key];
    }
    if (linked) insertRow.user_id = user.id;
    if (await tableHasColumn(supabase, "profiles", INSTAGRAM_COLUMN)) {
      insertRow.instagram = instagram.handle;
    }
    if (await tableHasColumn(supabase, "profiles", BIODATA_SHARE_COLUMN)) {
      insertRow[BIODATA_SHARE_COLUMN] = parseBiodataShare(body.biodata_share);
    }

    const photoUrl = asString(body.photo_url);
    const blurredUrl = asString(body.photo_blurred_url);
    if (!photoUrl || !isOwnStoredPhotoUrl(photoUrl, user.id)) {
      return NextResponse.json({ error: PROFILE_PHOTO_REQUIRED_ERROR }, { status: 400 });
    }
    if (await tableHasColumn(supabase, "profiles", "photo_url")) {
      insertRow.photo_url = photoUrl;
    }
    if (
      blurredUrl &&
      isOwnStoredPhotoUrl(blurredUrl, user.id) &&
      (await tableHasColumn(supabase, "profiles", "photo_blurred_url"))
    ) {
      insertRow.photo_blurred_url = blurredUrl;
    }

    const { data, error } = await supabase.from("profiles").insert([insertRow]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      message: "submitted for review",
      linked,
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Own-profile edit. Instagram, biodata_share, phone, and subscribe call opt-in — not a full re-review. */
export async function PATCH(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to update your profile.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON profile." }, { status: 400 });
    }

    const hasInstagram = Object.prototype.hasOwnProperty.call(body, "instagram");
    const hasShare = Object.prototype.hasOwnProperty.call(body, "biodata_share");
    const hasPhone = Object.prototype.hasOwnProperty.call(body, SUBSCRIBE_CALL_PHONE_COLUMN);
    const hasCallOptIn = Object.prototype.hasOwnProperty.call(body, SUBSCRIBE_CALL_OPT_IN_COLUMN);
    if (!hasInstagram && !hasShare && !hasPhone && !hasCallOptIn) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    let instagramHandle: string | null | undefined;
    if (hasInstagram) {
      const instagram = parseInstagramInput(body.instagram);
      if (instagram.error) {
        return NextResponse.json({ error: instagram.error }, { status: 400 });
      }
      instagramHandle = instagram.handle;
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) {
      return unauthorizedResponse(authError || "Sign in to update your profile.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a profile." },
        { status: 500 }
      );
    }

    if (hasInstagram && !(await tableHasColumn(supabase, "profiles", INSTAGRAM_COLUMN))) {
      return NextResponse.json({ error: INSTAGRAM_SQL_HINT }, { status: 503 });
    }
    if (hasShare && !(await tableHasColumn(supabase, "profiles", BIODATA_SHARE_COLUMN))) {
      return NextResponse.json({ error: BIODATA_SHARE_SQL_HINT }, { status: 503 });
    }
    if (
      (hasPhone || hasCallOptIn) &&
      !(
        (await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_PHONE_COLUMN)) &&
        (await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_OPT_IN_COLUMN))
      )
    ) {
      return NextResponse.json({ error: SUBSCRIBE_CALL_SQL_HINT }, { status: 503 });
    }

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (!linked) {
      return NextResponse.json({ error: "This profile is not linked to an account." }, { status: 400 });
    }

    const existingSelect =
      hasPhone || hasCallOptIn
        ? "id, " + SUBSCRIBE_CALL_PHONE_COLUMN + ", " + SUBSCRIBE_CALL_OPT_IN_COLUMN
        : "id";
    const existing = await supabase
      .from("profiles")
      .select(existingSelect)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ error: existing.error.message }, { status: 400 });
    }
    if (!existing.data) {
      return NextResponse.json({ error: "Create a profile first." }, { status: 404 });
    }

    const patch: Record<string, string | boolean | null> = {};
    if (hasInstagram) patch.instagram = instagramHandle ?? null;
    if (hasShare) patch[BIODATA_SHARE_COLUMN] = parseBiodataShare(body.biodata_share);

    if (hasPhone || hasCallOptIn) {
      const current = (existing.data || {}) as {
        phone?: string | null;
        call_subscribe_opt_in?: unknown;
        call_subscribe_opted_at?: string | null;
      };
      const nextPhone = hasPhone
        ? normalizeSubscribePhone(body.phone)
        : normalizeSubscribePhone(current.phone || "");
      if (hasPhone && typeof body.phone === "string" && body.phone.trim() && !nextPhone) {
        return NextResponse.json({ error: "That phone does not look usable." }, { status: 400 });
      }

      const wantsOptIn = hasCallOptIn
        ? parseCallSubscribeOptIn(body.call_subscribe_opt_in)
        : parseCallSubscribeOptIn(current.call_subscribe_opt_in);

      if (wantsOptIn && !nextPhone) {
        return NextResponse.json({ error: SUBSCRIBE_CALL_NEED_PHONE }, { status: 400 });
      }

      if (hasPhone) patch[SUBSCRIBE_CALL_PHONE_COLUMN] = nextPhone || null;
      if (hasCallOptIn || (hasPhone && !nextPhone && parseCallSubscribeOptIn(current.call_subscribe_opt_in))) {
        patch[SUBSCRIBE_CALL_OPT_IN_COLUMN] = wantsOptIn && !!nextPhone;
        if (wantsOptIn && nextPhone && !parseCallSubscribeOptIn(current.call_subscribe_opt_in)) {
          if (await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_OPTED_AT_COLUMN)) {
            patch[SUBSCRIBE_CALL_OPTED_AT_COLUMN] = new Date().toISOString();
          }
        }
      }
      delete patch[SUBSCRIBE_CALL_LAST_AT_COLUMN];
    }

    const updated = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", existing.data.id)
      .select()
      .maybeSingle();

    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: updated.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
