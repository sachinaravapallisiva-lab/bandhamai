import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  BIODATA_BASE_COLUMNS,
  BIODATA_FAILED_ERROR,
  BIODATA_NO_PROFILE_ERROR,
  BIODATA_OPTIONAL_COLUMNS,
  BIODATA_SIGNED_IN_ERROR,
  biodataContentDisposition,
  biodataFilename,
  buildBiodataPdf,
  profileToBiodataModel,
} from "../../../../lib/biodata";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

async function loadPhotoJpeg(url: string) {
  if (!url) return undefined;
  try {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length === 0) return undefined;
    return new Uint8Array(
      await sharp(input).rotate().resize(480, 480, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer()
    );
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(BIODATA_SIGNED_IN_ERROR);
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || BIODATA_SIGNED_IN_ERROR);

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    if (!linked) {
      return NextResponse.json({ error: BIODATA_NO_PROFILE_ERROR }, { status: 404 });
    }

    const optional = await Promise.all(
      BIODATA_OPTIONAL_COLUMNS.map(async function (column) {
        return {
          column,
          present: await tableHasColumn(supabase, "profiles", column),
        };
      })
    );
    const select = (BIODATA_BASE_COLUMNS as readonly string[])
      .concat(
        optional
          .filter(function (item) {
            return item.present;
          })
          .map(function (item) {
            return item.column;
          })
      )
      .join(",");

    const hasCreatedAt = await tableHasColumn(supabase, "profiles", "created_at");
    let query = supabase.from("profiles").select(select).eq("user_id", user.id);
    if (hasCreatedAt) query = query.order("created_at", { ascending: false });
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: BIODATA_NO_PROFILE_ERROR }, { status: 404 });
    }

    const row = data as unknown as Record<string, unknown>;
    const model = profileToBiodataModel(row, { viewerUserId: user.id });
    const photoJpeg = await loadPhotoJpeg(model.photoUrl);
    const bytes = await buildBiodataPdf(model, photoJpeg);
    const filename = biodataFilename(model.name);
    const body = Buffer.from(bytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": biodataContentDisposition(filename),
        "Cache-Control": "no-store",
        "Content-Length": String(body.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : BIODATA_FAILED_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
