import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { appConfig } from "@/lib/config";
import {
  addressingStyleSchema,
  type ConnectionSession,
} from "@/lib/connection";

type SessionPayload = {
  connection: ConnectionSession;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "SESSION_SECRET is missing. Add it to your environment before using login.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

function getSessionExpiryDate() {
  return new Date(Date.now() + appConfig.sessionDurationHours * 60 * 60 * 1000);
}

function isConnectionSession(value: unknown): value is ConnectionSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.endpoint === "string" &&
    typeof candidate.region === "string" &&
    typeof candidate.accessKeyId === "string" &&
    typeof candidate.secretAccessKey === "string" &&
    addressingStyleSchema.safeParse(candidate.addressingStyle).success
  );
}

export async function createSession(connection: ConnectionSession) {
  const token = await new EncryptJWT({ connection } satisfies SessionPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${appConfig.sessionDurationHours}h`)
    .encrypt(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(appConfig.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: getSessionExpiryDate(),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(appConfig.sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt(token, getSessionSecret(), {
      clockTolerance: 5,
    });

    if (!("connection" in payload) || !isConnectionSession(payload.connection)) {
      return null;
    }

    return payload.connection;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(appConfig.sessionCookieName);
}
