import { describe, expect, test } from "vitest";
import {
  isFolderKey,
  joinObjectKey,
  normalizeFolderKey,
  normalizeObjectKey,
  normalizePrefix,
} from "./s3";
import { sanitizeErrorMessage, toUserErrorMessage } from "./errors";

describe("s3 helpers", () => {
  test("normalizeObjectKey collapses empty path segments", () => {
    expect(normalizeObjectKey("/reports//2026 / summary.pdf")).toBe(
      "reports/2026/summary.pdf",
    );
  });

  test("normalizePrefix ensures a trailing slash", () => {
    expect(normalizePrefix("reports/2026")).toBe("reports/2026/");
    expect(normalizeFolderKey("reports/2026")).toBe("reports/2026/");
  });

  test("joinObjectKey builds a clean object key", () => {
    expect(joinObjectKey("reports/2026/", "/summary.pdf")).toBe(
      "reports/2026/summary.pdf",
    );
  });

  test("isFolderKey only matches folder-like keys", () => {
    expect(isFolderKey("reports/")).toBe(true);
    expect(isFolderKey("reports/file.txt")).toBe(false);
  });
});

describe("error sanitization", () => {
  test("sanitizeErrorMessage redacts explicit secrets and URL credentials", () => {
    const message =
      "Failed for AKIA123 and secret-value at https://user:pass@example.com";

    expect(sanitizeErrorMessage(message, ["AKIA123", "secret-value"])).toBe(
      "Failed for [redacted] and [redacted] at https://[redacted]:[redacted]@example.com",
    );
  });

  test("toUserErrorMessage falls back for non-Error values", () => {
    expect(toUserErrorMessage("oops", "Fallback message")).toBe(
      "Fallback message",
    );
  });
});
