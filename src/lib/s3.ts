import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import type { ConnectionSession } from "@/lib/connection";

export function createS3Client(connection: ConnectionSession) {
  return new S3Client({
    region: connection.region,
    endpoint: connection.endpoint,
    forcePathStyle: connection.addressingStyle === "path",
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
}

export async function validateS3Connection(connection: ConnectionSession) {
  const client = createS3Client(connection);

  try {
    await client.send(new ListBucketsCommand({}));
  } catch (error) {
    throw mapS3ValidationError(error);
  }
}

function mapS3ValidationError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    if (["InvalidAccessKeyId", "SignatureDoesNotMatch"].includes(error.name)) {
      return new Error("The supplied access key or secret key is invalid.");
    }

    if (["TimeoutError", "NetworkingError"].includes(error.name)) {
      return new Error(
        "The endpoint could not be reached. Check the host, port, and protocol.",
      );
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "$metadata" in error &&
    typeof error.$metadata === "object" &&
    error.$metadata !== null &&
    "httpStatusCode" in error.$metadata &&
    error.$metadata.httpStatusCode === 403
  ) {
    return new Error("The credentials were rejected by the S3-compatible service.");
  }

  return new Error(
    "Could not validate the connection. Check the endpoint, region, credentials, and addressing style.",
  );
}
