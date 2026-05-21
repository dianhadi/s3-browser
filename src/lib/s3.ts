import {
  ListBucketsCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import {
  getAddressingStyleLabel,
  getEndpointDetails,
  type ConnectionSession,
} from "@/lib/connection";

export class S3ConnectionError extends Error {
  code:
    | "INVALID_CREDENTIALS"
    | "ENDPOINT_UNREACHABLE"
    | "ACCESS_DENIED"
    | "INVALID_CONFIGURATION"
    | "UNKNOWN";

  constructor(
    code: S3ConnectionError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "S3ConnectionError";
    this.code = code;
  }
}

export type S3ConnectionSummary = {
  endpoint: string;
  hostname: string;
  protocol: "http" | "https";
  port: string;
  isLocalhost: boolean;
  isIpAddress: boolean;
  addressingStyle: ConnectionSession["addressingStyle"];
  addressingLabel: string;
  forcePathStyle: boolean;
};

export function createS3Client(connection: ConnectionSession) {
  return new S3Client(buildS3ClientConfig(connection));
}

export function buildS3ClientConfig(connection: ConnectionSession) {
  const endpoint = getEndpointDetails(connection.endpoint);

  return {
    region: connection.region,
    endpoint: endpoint.origin,
    forcePathStyle: shouldForcePathStyle(connection),
    tls: endpoint.protocol === "https",
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  };
}

export function shouldForcePathStyle(connection: ConnectionSession) {
  return connection.addressingStyle === "path";
}

export function getS3ConnectionSummary(
  connection: ConnectionSession,
): S3ConnectionSummary {
  const endpoint = getEndpointDetails(connection.endpoint);

  return {
    endpoint: endpoint.origin,
    hostname: endpoint.hostname,
    protocol: endpoint.protocol,
    port: endpoint.port,
    isLocalhost: endpoint.isLocalhost,
    isIpAddress: endpoint.isIpAddress,
    addressingStyle: connection.addressingStyle,
    addressingLabel: getAddressingStyleLabel(connection.addressingStyle),
    forcePathStyle: shouldForcePathStyle(connection),
  };
}

export async function validateS3Connection(connection: ConnectionSession) {
  const client = createS3Client(connection);

  try {
    await client.send(new ListBucketsCommand({}));
  } catch (error) {
    throw mapS3Error(error);
  }
}

export function normalizeBucketName(value: string) {
  return value.trim();
}

export function normalizeObjectKey(value: string) {
  const segments = value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.join("/");
}

export function normalizePrefix(value: string) {
  const normalized = normalizeObjectKey(value);
  return normalized ? `${normalized}/` : "";
}

export function normalizeFolderKey(value: string) {
  return normalizePrefix(value);
}

export function joinObjectKey(...segments: string[]) {
  return normalizeObjectKey(segments.join("/"));
}

export function isFolderKey(value: string) {
  return value.endsWith("/");
}

export function mapS3Error(error: unknown) {
  if (error instanceof S3ConnectionError) {
    return error;
  }

  if (error instanceof S3ServiceException) {
    if (["InvalidAccessKeyId", "SignatureDoesNotMatch"].includes(error.name)) {
      return new S3ConnectionError(
        "INVALID_CREDENTIALS",
        "The supplied access key or secret key is invalid.",
        { cause: error },
      );
    }

    if (error.$metadata.httpStatusCode === 403) {
      return new S3ConnectionError(
        "ACCESS_DENIED",
        "The credentials were rejected by the S3-compatible service.",
        { cause: error },
      );
    }

    if (error.$metadata.httpStatusCode === 400) {
      return new S3ConnectionError(
        "INVALID_CONFIGURATION",
        "The S3-compatible service rejected the request. Check the region and addressing style.",
        { cause: error },
      );
    }
  }

  if (hasNamedError(error, ["TimeoutError", "NetworkingError", "ECONNREFUSED"])) {
    return new S3ConnectionError(
      "ENDPOINT_UNREACHABLE",
      "The endpoint could not be reached. Check the host, port, and protocol.",
      { cause: error },
    );
  }

  if (hasMessage(error, ["ENOTFOUND", "getaddrinfo", "fetch failed"])) {
    return new S3ConnectionError(
      "ENDPOINT_UNREACHABLE",
      "The endpoint could not be reached. Check the host, port, and protocol.",
      { cause: error },
    );
  }

  return new S3ConnectionError(
    "UNKNOWN",
    "Could not validate the connection. Check the endpoint, region, credentials, and addressing style.",
    { cause: error },
  );
}

function hasNamedError(error: unknown, names: string[]) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string" &&
    names.includes(error.name)
  );
}

function hasMessage(error: unknown, messageParts: string[]) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("message" in error) ||
    typeof error.message !== "string"
  ) {
    return false;
  }

  const message = error.message;
  return messageParts.some((part) => message.includes(part));
}
