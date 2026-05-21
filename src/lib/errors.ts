const REDACTED = "[redacted]";

export function sanitizeErrorMessage(
  message: string,
  secrets: Array<string | undefined> = [],
) {
  let sanitized = message;

  for (const secret of secrets) {
    if (!secret) {
      continue;
    }

    sanitized = sanitized.split(secret).join(REDACTED);
  }

  sanitized = sanitized.replace(
    /(https?:\/\/)([^/\s:@]+):([^/\s@]+)@/gi,
    "$1[redacted]:[redacted]@",
  );

  return sanitized;
}

export function toUserErrorMessage(
  error: unknown,
  fallback: string,
  secrets: Array<string | undefined> = [],
) {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  return sanitizeErrorMessage(error.message, secrets);
}
