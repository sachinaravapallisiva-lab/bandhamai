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
import { INSTAGRAM_COLUMN, INSTAGRAM_SQL_HINT, parseInstagramInput } from "../../../lib/instagram";
import { isOwnStoredPhotoUrl, PROFILE_PHOTO_REQUIRED_ERROR } from "../../../lib/profile-photos";

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

    const insertRow: Record<string, string | null> = {
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

/** Own-profile edit. v1 only writes Instagram — not a full re-review of other fields. */
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

    const instagram = parseInstagramInput(body.instagram);
    if (instagram.error) {
      return NextResponse.json({ error: instagram.error }, { status: 400 });
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

    if (!(await tableHasColumn(supabase, "profiles", INSTAGRAM_COLUMN))) {
      return NextResponse.json({ error: INSTAGRAM_SQL_HINT }, { status: 503 });
    }

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (!linked) {
      return NextResponse.json({ error: "This profile is not linked to an account." }, { status: 400 });
    }

    const existing = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ error: existing.error.message }, { status: 400 });
    }
    if (!existing.data) {
      return NextResponse.json({ error: "Create a profile first." }, { status: 404 });
    }

    const updated = await supabase
      .from("profiles")
      .update({ instagram: instagram.handle })
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
