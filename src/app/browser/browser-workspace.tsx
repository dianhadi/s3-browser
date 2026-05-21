"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadButton } from "@/app/browser/download-button";
import type {
  S3BrowserFolder,
  S3BrowserListing,
  S3BrowserObject,
  S3ObjectMetadata,
} from "@/lib/s3";
import { UploadControl } from "./upload-control";
import styles from "./page.module.css";

type BrowserWorkspaceProps = {
  bucket: string;
  prefix: string;
  listing: S3BrowserListing | null;
  listingError: string | null;
};

type Selection =
  | { type: "folder"; key: string; name: string }
  | { type: "object"; key: string; name: string };

type MetadataState =
  | { kind: "idle" }
  | { kind: "folder"; folder: S3BrowserFolder }
  | { kind: "loading"; key: string }
  | { kind: "object"; metadata: S3ObjectMetadata }
  | { kind: "error"; message: string };

export function BrowserWorkspace({
  bucket,
  prefix,
  listing,
  listingError,
}: BrowserWorkspaceProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [metadataState, setMetadataState] = useState<MetadataState>({ kind: "idle" });

  const entryCount = listing
    ? listing.folders.length + listing.objects.length
    : 0;

  const isBusy = isRefreshing;
  const breadcrumbSegments = useMemo(() => getBreadcrumbSegments(prefix), [prefix]);

  async function handleCreateFolder() {
    if (!bucket) {
      return;
    }

    const folderName = window.prompt("Folder name");

    if (!folderName?.trim()) {
      return;
    }

    setActionMessage("Creating folder...");

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket,
          prefix,
          folderName,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not create the folder.");
      }

      setActionMessage(`Created folder ${folderName}.`);
      refreshListing();
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Could not create the folder.",
      );
    }
  }

  async function handleDeleteSelected() {
    if (!bucket || !selection) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selection.type} "${selection.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setActionMessage("Deleting...");

    try {
      const response = await fetch("/api/entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket,
          key: selection.key,
          type: selection.type,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete the selected entry.");
      }

      setSelection(null);
      setMetadataState({ kind: "idle" });
      setActionMessage(`Deleted ${selection.name}.`);
      refreshListing();
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Could not delete the selected entry.",
      );
    }
  }

  async function handlePreviewObjectMetadata(object: S3BrowserObject) {
    if (!bucket) {
      return;
    }

    setMetadataState({ kind: "loading", key: object.key });

    try {
      const params = new URLSearchParams({
        bucket,
        key: object.key,
      });
      const response = await fetch(`/api/metadata?${params.toString()}`);
      const payload = (await response.json()) as
        | ({ error?: string } & Partial<S3ObjectMetadata>)
        | undefined;

      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Could not load metadata.");
      }

      setMetadataState({
        kind: "object",
        metadata: payload as S3ObjectMetadata,
      });
    } catch (error) {
      setMetadataState({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not load metadata.",
      });
    }
  }

  function handleSelectFolder(folder: S3BrowserFolder) {
    setSelection({
      type: "folder",
      key: folder.prefix,
      name: `${folder.name}/`,
    });
    setMetadataState({
      kind: "folder",
      folder,
    });
  }

  function handleSelectObject(object: S3BrowserObject) {
    setSelection({
      type: "object",
      key: object.key,
      name: object.name,
    });
    void handlePreviewObjectMetadata(object);
  }

  function refreshListing() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <section className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <strong>Current path</strong>
          <div className={styles.breadcrumbs}>
            <Link
              className={styles.breadcrumbLink}
              href={bucket ? buildBrowserHref(bucket) : "/browser"}
            >
              {bucket || "No bucket selected"}
            </Link>
            {breadcrumbSegments.map((segment) => (
              <Link
                className={styles.breadcrumbLink}
                href={buildBrowserHref(bucket, segment.prefix)}
                key={segment.prefix}
              >
                / {segment.name}
              </Link>
            ))}
          </div>
          <p className={styles.transferMessage}>
            {actionMessage ||
              (selection
                ? `Selected ${selection.type}: ${selection.name}`
                : "Choose an object or folder to preview metadata or delete it.")}
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <UploadControl
            bucket={bucket}
            disabled={!bucket || Boolean(listingError)}
            prefix={prefix}
          />
          <button
            className={styles.toolbarButton}
            disabled={!bucket || isBusy}
            onClick={() => {
              void handleCreateFolder();
            }}
            type="button"
          >
            Create folder
          </button>
          <button
            className={styles.toolbarButton}
            disabled={!selection || isBusy}
            onClick={() => {
              void handleDeleteSelected();
            }}
            type="button"
          >
            Delete selected
          </button>
        </div>
      </section>

      <section className={styles.mainContent}>
        <div className={styles.tableCard}>
          <div>
            <div className={styles.mainHeader}>
              <h2>Objects</h2>
              <span>{listing ? `${entryCount} visible entries` : "not loaded"}</span>
            </div>
            <p className={styles.tableMeta}>
              Folder navigation uses prefix and delimiter semantics from the
              S3-compatible API.
            </p>
          </div>

          {listingError ? (
            <div className={styles.errorState}>{listingError}</div>
          ) : !bucket ? (
            <div className={styles.emptyState}>
              No bucket selected yet. Choose a bucket from the left sidebar.
            </div>
          ) : listing && entryCount > 0 ? (
            <div className={styles.objectTable}>
              <div className={styles.tableHeader}>
                <span>Name</span>
                <span>Size</span>
                <span>Updated</span>
                <span>Action</span>
              </div>

              {listing.folders.map((folder) => {
                const isSelected =
                  selection?.type === "folder" && selection.key === folder.prefix;

                return (
                  <div
                    className={`${styles.objectRow} ${isSelected ? styles.objectRowActive : ""}`}
                    key={folder.key}
                  >
                    <Link
                      className={styles.objectLink}
                      href={buildBrowserHref(bucket, folder.prefix)}
                    >
                      <div className={styles.objectCell}>
                        <strong>{folder.name}/</strong>
                        <span>{folder.prefix}</span>
                      </div>
                    </Link>
                    <span>-</span>
                    <span>-</span>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.inlineActionButton}
                        onClick={() => {
                          handleSelectFolder(folder);
                        }}
                        type="button"
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {listing.objects.map((object) => {
                const isSelected =
                  selection?.type === "object" && selection.key === object.key;

                return (
                  <div
                    className={`${styles.objectRow} ${isSelected ? styles.objectRowActive : ""}`}
                    key={object.key}
                  >
                    <button
                      className={styles.objectLinkButton}
                      onClick={() => {
                        handleSelectObject(object);
                      }}
                      type="button"
                    >
                      <div className={styles.objectCell}>
                        <strong>{object.name}</strong>
                        <span>{object.key}</span>
                      </div>
                    </button>
                    <span>{formatBytes(object.size)}</span>
                    <span>{formatDate(object.lastModified)}</span>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.inlineActionButton}
                        onClick={() => {
                          handleSelectObject(object);
                        }}
                        type="button"
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                      <DownloadButton bucket={bucket} objectKey={object.key} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              This location is empty. Upload a file here or create a folder.
            </div>
          )}
        </div>

        <aside className={styles.metadataCard}>
          <div>
            <div className={styles.mainHeader}>
              <h2>Metadata</h2>
              <span>phase 6</span>
            </div>
            <p className={styles.tableMeta}>
              Object metadata is loaded on demand. Folder selection shows local
              listing context.
            </p>
          </div>

          {metadataState.kind === "idle" ? (
            <div className={styles.emptyState}>
              Select an object or folder to preview details.
            </div>
          ) : metadataState.kind === "loading" ? (
            <div className={styles.emptyState}>Loading metadata...</div>
          ) : metadataState.kind === "error" ? (
            <div className={styles.errorState}>{metadataState.message}</div>
          ) : metadataState.kind === "folder" ? (
            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Type</dt>
                <dd>Folder</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Name</dt>
                <dd>{metadataState.folder.name}/</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Prefix</dt>
                <dd>{metadataState.folder.prefix}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Bucket</dt>
                <dd>{bucket || "-"}</dd>
              </div>
            </dl>
          ) : (
            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Bucket</dt>
                <dd>{metadataState.metadata.bucket}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Key</dt>
                <dd>{metadataState.metadata.key}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Size</dt>
                <dd>
                  {metadataState.metadata.contentLength === null
                    ? "-"
                    : formatBytes(metadataState.metadata.contentLength)}
                </dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Type</dt>
                <dd>{metadataState.metadata.contentType || "-"}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>ETag</dt>
                <dd>{metadataState.metadata.etag || "-"}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Updated</dt>
                <dd>{formatDate(metadataState.metadata.lastModified)}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Metadata</dt>
                <dd>
                  {Object.keys(metadataState.metadata.metadata).length
                    ? JSON.stringify(metadataState.metadata.metadata)
                    : "-"}
                </dd>
              </div>
            </dl>
          )}
        </aside>
      </section>
    </>
  );
}

function buildBrowserHref(bucket?: string, prefix?: string) {
  const params = new URLSearchParams();

  if (bucket) {
    params.set("bucket", bucket);
  }

  if (prefix) {
    params.set("prefix", prefix.endsWith("/") ? prefix : `${prefix}/`);
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
