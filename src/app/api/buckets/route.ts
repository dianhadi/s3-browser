import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listBuckets, mapS3Error } from "@/lib/s3";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const buckets = await listBuckets(session);
    return NextResponse.json({ buckets });
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: mapped.message,
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
