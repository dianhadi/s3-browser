import {
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export type S3BucketSummary = {
  name: string;
  createdAt: string | null;
};

export type S3BrowserFolder = {
  type: "folder";
  name: string;
  key: string;
  prefix: string;
};

export type S3BrowserObject = {
  type: "object";
  name: string;
  key: string;
  size: number;
  lastModified: string | null;
  etag: string | null;
};

export type S3BrowserListing = {
  bucket: string;
  prefix: string;
  folders: S3BrowserFolder[];
  objects: S3BrowserObject[];
};

export type PresignedUploadRequest = {
  bucket: string;
  key: string;
  contentType?: string;
};

export type PresignedDownloadRequest = {
  bucket: string;
  key: string;
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

export async function listBuckets(connection: ConnectionSession) {
  const client = createS3Client(connection);

  try {
    const response = await client.send(new ListBucketsCommand({}));

    return (response.Buckets || [])
      .map((bucket) => ({
        name: bucket.Name || "",
        createdAt: bucket.CreationDate?.toISOString() || null,
      }))
      .filter((bucket): bucket is S3BucketSummary => Boolean(bucket.name))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw mapS3Error(error);
  }
}

export async function listObjects(
  connection: ConnectionSession,
  bucketName: string,
  prefix = "",
): Promise<S3BrowserListing> {
  const client = createS3Client(connection);
  const bucket = normalizeBucketName(bucketName);
  const normalizedPrefix = normalizePrefix(prefix);

  try {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizedPrefix || undefined,
        Delimiter: "/",
      }),
    );

    const folders = (response.CommonPrefixes || [])
      .map((entry) => {
        const folderPrefix = normalizePrefix(entry.Prefix || "");

        if (!folderPrefix) {
          return null;
        }

        const relativePrefix = normalizedPrefix
          ? folderPrefix.slice(normalizedPrefix.length)
          : folderPrefix;
        const name = relativePrefix.replace(/\/$/, "");

        return {
          type: "folder" as const,
          name,
          key: folderPrefix,
          prefix: folderPrefix,
        };
      })
      .filter((entry): entry is S3BrowserFolder => Boolean(entry))
      .sort((left, right) => left.name.localeCompare(right.name));

    const objects = (response.Contents || [])
      .map((entry) => {
        const key = entry.Key || "";

        if (!key || key === normalizedPrefix || isFolderKey(key)) {
          return null;
        }

        const name = normalizedPrefix ? key.slice(normalizedPrefix.length) : key;

        if (!name || name.includes("/")) {
          return null;
        }

        return {
          type: "object" as const,
          name,
          key,
          size: entry.Size || 0,
          lastModified: entry.LastModified?.toISOString() || null,
          etag: entry.ETag || null,
        };
      })
      .filter((entry): entry is S3BrowserObject => Boolean(entry))
      .sort((left, right) => left.name.localeCompare(right.name));

    return {
      bucket,
      prefix: normalizedPrefix,
      folders,
      objects,
    };
  } catch (error) {
    throw mapS3Error(error);
  }
}

export async function createPresignedUploadUrl(
  connection: ConnectionSession,
  request: PresignedUploadRequest,
) {
  const client = createS3Client(connection);
  const bucket = normalizeBucketName(request.bucket);
  const key = normalizeObjectKey(request.key);

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: request.contentType || "application/octet-stream",
    });

    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    return {
      url,
      bucket,
      key,
      method: "PUT" as const,
    };
  } catch (error) {
    throw mapS3Error(error);
  }
}

export async function createPresignedDownloadUrl(
  connection: ConnectionSession,
  request: PresignedDownloadRequest,
) {
  const client = createS3Client(connection);
  const bucket = normalizeBucketName(request.bucket);
  const key = normalizeObjectKey(request.key);
  const fileName = key.split("/").pop() || "download";

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    return {
      url,
      bucket,
      key,
      method: "GET" as const,
    };
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
