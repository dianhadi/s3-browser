import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  createFolder,
  joinObjectKey,
  mapS3Error,
  normalizeBucketName,
  normalizePrefix,
} from "@/lib/s3";

const folderRequestSchema = z.object({
  bucket: z.string().trim().min(1, "Bucket is required."),
  prefix: z.string().trim().optional(),
  folderName: z.string().trim().min(1, "Folder name is required."),
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

  const parsed = folderRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid folder request." },
      { status: 400 },
    );
  }

  const bucket = normalizeBucketName(parsed.data.bucket);
  const prefix = normalizePrefix(parsed.data.prefix || "");
  const folderPath = joinObjectKey(prefix, parsed.data.folderName);

  try {
    const result = await createFolder(session, bucket, folderPath);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapS3Error(error);

    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: 400 },
    );
  }
}
