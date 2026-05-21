import { z } from "zod";

export const addressingStyleSchema = z.enum(["path", "virtual"]);

const endpointSchema = z
  .string()
  .trim()
  .min(1, "Endpoint is required.")
  .superRefine((value, ctx) => {
    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endpoint must be a valid URL, including http:// or https://.",
      });
      return;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endpoint must use http:// or https://.",
      });
    }

    if (!parsed.hostname) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endpoint hostname is required.",
      });
    }

    if (parsed.username || parsed.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endpoint must not include embedded credentials.",
      });
    }
  });

export const connectionInputSchema = z.object({
  endpoint: endpointSchema,
  region: z.string().trim().min(1, "Region is required."),
  accessKeyId: z.string().trim().min(1, "Access key is required."),
  secretAccessKey: z.string().trim().min(1, "Secret key is required."),
  addressingStyle: addressingStyleSchema,
});

export type ConnectionInput = z.infer<typeof connectionInputSchema>;

export type ConnectionSession = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  addressingStyle: z.infer<typeof addressingStyleSchema>;
};

export function normalizeEndpoint(value: string) {
  const url = new URL(value.trim());
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function normalizeConnectionInput(
  input: ConnectionInput,
): ConnectionSession {
  return {
    endpoint: normalizeEndpoint(input.endpoint),
    region: input.region.trim(),
    accessKeyId: input.accessKeyId.trim(),
    secretAccessKey: input.secretAccessKey.trim(),
    addressingStyle: input.addressingStyle,
  };
}

export function maskAccessKey(accessKeyId: string) {
  if (accessKeyId.length <= 4) {
    return "****";
  }

  return `${accessKeyId.slice(0, 2)}${"*".repeat(
    Math.max(4, accessKeyId.length - 4),
  )}${accessKeyId.slice(-2)}`;
}
