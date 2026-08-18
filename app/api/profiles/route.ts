import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          full_name: body.full_name,
          gender: body.gender,
          city: body.city,
          mother_tongue: body.mother_tongue,
          visa_status: body.visa_status,
          education: body.education,
          profession: body.profession,
          about: body.about,
          wants: body.wants,
          status: "live",
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}