import { NextRequest, NextResponse } from "next/server";
import { toUserErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  getObjectMetadata,
  mapS3Error,
  normalizeBucketName,
  normalizeObjectKey,
} from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bucket = normalizeBucketName(
    request.nextUrl.searchParams.get("bucket") || "",
  );
  const key = normalizeObjectKey(request.nextUrl.searchParams.get("key") || "");

  if (!bucket || !key) {
    return NextResponse.json(
      { error: "Query parameters `bucket` and `key` are required." },
      { status: 400 },
    );
  }

  try {
    const metadata = await getObjectMetadata(session, bucket, key);
    return NextResponse.json(metadata);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: toUserErrorMessage(mapped, "Could not load metadata.", [
          session.accessKeyId,
          session.secretAccessKey,
        ]),
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
