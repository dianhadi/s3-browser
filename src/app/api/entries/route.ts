import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toUserErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  deleteEntry,
  mapS3Error,
  normalizeBucketName,
  normalizeObjectKey,
} from "@/lib/s3";

const deleteRequestSchema = z.object({
  bucket: z.string().trim().min(1, "Bucket is required."),
  key: z.string().trim().min(1, "Key is required."),
  type: z.enum(["folder", "object"]),
});

export async function DELETE(request: NextRequest) {
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

  const parsed = deleteRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid delete request." },
      { status: 400 },
    );
  }

  const bucket = normalizeBucketName(parsed.data.bucket);
  const key =
    parsed.data.type === "folder"
      ? parsed.data.key
      : normalizeObjectKey(parsed.data.key);

  try {
    const result = await deleteEntry(session, bucket, key);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      {
        error: toUserErrorMessage(mapped, "Could not delete the selected entry.", [
          session.accessKeyId,
          session.secretAccessKey,
        ]),
        code: mapped.code,
      },
      { status: 400 },
    );
  }
}
