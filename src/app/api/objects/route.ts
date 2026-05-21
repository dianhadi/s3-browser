import { NextRequest, NextResponse } from "next/server";
import { toUserErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";
import { listObjects, mapS3Error, normalizeBucketName } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bucket = normalizeBucketName(
    request.nextUrl.searchParams.get("bucket") || "",
  );
  const prefix = request.nextUrl.searchParams.get("prefix") || "";

  if (!bucket) {
    return NextResponse.json(
      { error: "Query parameter `bucket` is required." },
      { status: 400 },
    );
  }

  try {
    const listing = await listObjects(session, bucket, prefix);
    return NextResponse.json(listing);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: toUserErrorMessage(mapped, "Could not list objects.", [
          session.accessKeyId,
          session.secretAccessKey,
        ]),
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
