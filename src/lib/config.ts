const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "S3 Browser";
const sessionCookieName =
  process.env.SESSION_COOKIE_NAME?.trim() || "s3-browser-session";
const sessionDurationHours = Number.parseInt(
  process.env.SESSION_DURATION_HOURS || "12",
  10,
);

export const appConfig = {
  appName,
  sessionCookieName,
  sessionDurationHours:
    Number.isFinite(sessionDurationHours) && sessionDurationHours > 0
      ? sessionDurationHours
      : 12,
};
