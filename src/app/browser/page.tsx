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

  const breadcrumbSegments = getBreadcrumbSegments(activePrefix);

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

        <section className={styles.toolbar}>
          <div className={styles.toolbarMeta}>
            <strong>Current path</strong>
            <div className={styles.breadcrumbs}>
              <Link
                className={styles.breadcrumbLink}
                href={activeBucket ? buildBrowserHref(activeBucket) : "/browser"}
              >
                {activeBucket || "No bucket selected"}
              </Link>
              {breadcrumbSegments.map((segment) => (
                <Link
                  className={styles.breadcrumbLink}
                  href={buildBrowserHref(activeBucket, segment.prefix)}
                  key={segment.prefix}
                >
                  / {segment.name}
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.toolbarActions}>
            <button className={styles.toolbarButton} type="button" disabled>
              Upload file
            </button>
            <button className={styles.toolbarButton} type="button" disabled>
              Create folder
            </button>
            <button className={styles.toolbarButton} type="button" disabled>
              Delete
            </button>
          </div>
        </section>

        <section className={styles.mainContent}>
          <div className={styles.tableCard}>
            <div>
              <div className={styles.mainHeader}>
                <h2>Objects</h2>
                <span>
                  {listing
                    ? `${listing.folders.length + listing.objects.length} visible entries`
                    : "not loaded"}
                </span>
              </div>
              <p className={styles.tableMeta}>
                Folder navigation uses prefix and delimiter semantics from the
                S3-compatible API.
              </p>
            </div>

            {listingError ? (
              <div className={styles.errorState}>{listingError}</div>
            ) : !activeBucket ? (
              <div className={styles.emptyState}>
                No bucket selected yet. Choose a bucket from the left sidebar.
              </div>
            ) : listing && listing.folders.length + listing.objects.length > 0 ? (
              <div className={styles.objectTable}>
                <div className={styles.tableHeader}>
                  <span>Name</span>
                  <span>Size</span>
                  <span>Updated</span>
                </div>

                {listing.folders.map((folder) => (
                  <Link
                    className={styles.objectRow}
                    href={buildBrowserHref(activeBucket, folder.prefix)}
                    key={folder.key}
                  >
                    <div className={styles.objectCell}>
                      <strong>{folder.name}/</strong>
                      <span>Folder</span>
                    </div>
                    <span>-</span>
                    <span>-</span>
                  </Link>
                ))}

                {listing.objects.map((object) => (
                  <div className={styles.objectRow} key={object.key}>
                    <div className={styles.objectCell}>
                      <strong>{object.name}</strong>
                      <span>{object.key}</span>
                    </div>
                    <span>{formatBytes(object.size)}</span>
                    <span>{formatDate(object.lastModified)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                This location is empty. Upload files or create a folder in a
                later phase.
              </div>
            )}
          </div>

          <aside className={styles.metadataCard}>
            <div>
              <div className={styles.mainHeader}>
                <h2>Listing context</h2>
                <span>phase 4</span>
              </div>
              <p className={styles.tableMeta}>
                Metadata preview for individual objects will be added in Phase 6.
              </p>
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Bucket</dt>
                <dd>{activeBucket || "-"}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Prefix</dt>
                <dd>{activePrefix || "/"}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Folders</dt>
                <dd>{listing?.folders.length ?? 0}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Objects</dt>
                <dd>{listing?.objects.length ?? 0}</dd>
              </div>
            </dl>
          </aside>
        </section>
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

function getBreadcrumbSegments(prefix: string) {
  if (!prefix) {
    return [];
  }

  const parts = prefix.split("/").filter(Boolean);

  return parts.map((name, index) => ({
    name,
    prefix: `${parts.slice(0, index + 1).join("/")}/`,
  }));
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
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
