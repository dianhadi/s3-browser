import Link from "next/link";
import { appConfig } from "@/lib/config";
import { getAddressingStyleLabel, maskAccessKey } from "@/lib/connection";
import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/session";
import {
  getS3ConnectionSummary,
  listBuckets,
  listObjects,
  mapS3Error,
  normalizeBucketName,
  normalizePrefix,
  type S3BucketSummary,
  type S3BrowserListing,
} from "@/lib/s3";
import { redirect } from "next/navigation";
import { BrowserWorkspace } from "./browser-workspace";
import styles from "./page.module.css";

type BrowserPageProps = {
  searchParams?: Promise<{
    bucket?: string;
    prefix?: string;
  }>;
};

export default async function BrowserPage({ searchParams }: BrowserPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const summary = getS3ConnectionSummary(session);
  const params = (await searchParams) || {};

  let buckets: S3BucketSummary[] = [];
  let listing: S3BrowserListing | null = null;
  let listingError: string | null = null;

  try {
    buckets = await listBuckets(session);
  } catch (error) {
    listingError = mapS3Error(error).message;
  }

  const requestedBucket = normalizeBucketName(params.bucket || "");
  const activeBucket = requestedBucket || buckets[0]?.name || "";
  const activePrefix = normalizePrefix(params.prefix || "");

  if (activeBucket && !listingError) {
    try {
      listing = await listObjects(session, activeBucket, activePrefix);
    } catch (error) {
      listingError = mapS3Error(error).message;
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1>{appConfig.appName}</h1>
          <p>Live S3-compatible bucket and object browsing.</p>
        </div>

        <section className={styles.bucketPanel}>
          <div className={styles.bucketHeader}>
            <h2>Buckets</h2>
            <span>{buckets.length}</span>
          </div>
          <div className={styles.bucketList}>
            {buckets.length ? (
              buckets.map((bucket) => {
                const isActive = bucket.name === activeBucket;

                return (
                  <Link
                    className={`${styles.bucketRow} ${isActive ? styles.bucketRowActive : ""}`}
                    href={buildBrowserHref(bucket.name)}
                    key={bucket.name}
                  >
                    <strong>{bucket.name}</strong>
                    <span>{formatCreatedAt(bucket.createdAt)}</span>
                  </Link>
                );
              })
            ) : (
              <div className={styles.bucketEmpty}>No buckets available.</div>
            )}
          </div>
        </section>

        <section className={styles.quickActions}>
          <div className={styles.quickAction}>
            <strong>Endpoint</strong>
            <span>{summary.endpoint}</span>
          </div>
          <div className={styles.quickAction}>
            <strong>Connection</strong>
            <span>
              {summary.protocol.toUpperCase()}
              {summary.port ? `:${summary.port}` : ""}
              {" / "}
              {summary.hostname}
            </span>
          </div>
          <div className={styles.quickAction}>
            <strong>Session</strong>
            <span>
              {getAddressingStyleLabel(session.addressingStyle)}
              {" / "}
              {maskAccessKey(session.accessKeyId)}
            </span>
          </div>
        </section>

        <form action={logoutAction}>
          <button className={styles.logoutButton} type="submit">
            Sign out
          </button>
        </form>
      </aside>

      <section className={styles.main}>
        <header className={styles.mainHeader}>
          <div>
            <h2>Bucket browser</h2>
            <p className={styles.statusNote}>
              Browse folders and objects directly from the connected
              S3-compatible storage.
            </p>
          </div>
        </header>

        <BrowserWorkspace
          bucket={activeBucket}
          listing={listing}
          listingError={listingError}
          prefix={activePrefix}
        />
      </section>
    </main>
  );
}

function buildBrowserHref(bucket?: string, prefix?: string) {
  const params = new URLSearchParams();

  if (bucket) {
    params.set("bucket", bucket);
  }

  if (prefix) {
    params.set("prefix", normalizePrefix(prefix));
  }

  const query = params.toString();
  return query ? `/browser?${query}` : "/browser";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatCreatedAt(value: string | null) {
  if (!value) {
    return "created date unavailable";
  }

  return formatDate(value);
}
