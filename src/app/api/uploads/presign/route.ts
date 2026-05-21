import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toUserErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  createPresignedUploadUrl,
  mapS3Error,
  normalizeBucketName,
  normalizeObjectKey,
} from "@/lib/s3";

const uploadRequestSchema = z.object({
  bucket: z.string().trim().min(1, "Bucket is required."),
  key: z.string().trim().min(1, "Object key is required."),
  contentType: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = uploadRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid upload request." },
      { status: 400 },
    );
  }

  try {
    const presigned = await createPresignedUploadUrl(session, {
      bucket: normalizeBucketName(parsed.data.bucket),
      key: normalizeObjectKey(parsed.data.key),
      contentType: parsed.data.contentType,
    });

    return NextResponse.json(presigned);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: toUserErrorMessage(mapped, "Could not prepare the upload.", [
          session.accessKeyId,
          session.secretAccessKey,
        ]),
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
