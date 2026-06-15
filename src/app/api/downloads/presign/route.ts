import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toUserErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  createPresignedDownloadUrl,
  mapS3Error,
  normalizeBucketName,
  normalizeObjectKey,
} from "@/lib/s3";

const dispositionSchema = z.enum(["attachment", "inline"]);

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bucket = normalizeBucketName(
    request.nextUrl.searchParams.get("bucket") || "",
  );
  const key = normalizeObjectKey(request.nextUrl.searchParams.get("key") || "");
  const disposition = dispositionSchema.safeParse(
    request.nextUrl.searchParams.get("disposition") || "attachment",
  );

  if (!bucket || !key) {
    return NextResponse.json(
      { error: "Query parameters `bucket` and `key` are required." },
      { status: 400 },
    );
  }

  if (!disposition.success) {
    return NextResponse.json(
      { error: "Query parameter `disposition` must be `attachment` or `inline`." },
      { status: 400 },
    );
  }

  try {
    const presigned = await createPresignedDownloadUrl(session, {
      bucket,
      key,
      disposition: disposition.data,
    });
    return NextResponse.json(presigned);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: toUserErrorMessage(mapped, "Could not prepare the download.", [
          session.accessKeyId,
          session.secretAccessKey,
        ]),
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
