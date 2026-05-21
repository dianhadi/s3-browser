"use server";

import { redirect } from "next/navigation";
import {
  connectionInputSchema,
  normalizeConnectionInput,
} from "@/lib/connection";
import { validateS3Connection } from "@/lib/s3";
import { createSession, destroySession } from "@/lib/session";

export type LoginActionState = {
  error?: string;
  fields?: {
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    addressingStyle?: "path" | "virtual";
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const fields = {
    endpoint: String(formData.get("endpoint") || ""),
    region: String(formData.get("region") || ""),
    accessKeyId: String(formData.get("accessKeyId") || ""),
    secretAccessKey: String(formData.get("secretAccessKey") || ""),
    addressingStyle: String(formData.get("addressingStyle") || "path"),
  };

  const parsed = connectionInputSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid connection details.",
      fields: {
        endpoint: fields.endpoint,
        region: fields.region,
        accessKeyId: fields.accessKeyId,
        addressingStyle:
          fields.addressingStyle === "virtual" ? "virtual" : "path",
      },
    };
  }

  const connection = normalizeConnectionInput(parsed.data);

  try {
    await validateS3Connection(connection);
    await createSession(connection);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create the session.",
      fields: {
        endpoint: connection.endpoint,
        region: connection.region,
        accessKeyId: connection.accessKeyId,
        addressingStyle: connection.addressingStyle,
      },
    };
  }

  redirect("/browser");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
