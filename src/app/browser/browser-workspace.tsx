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
  | {
      kind: "object";
      metadata: S3ObjectMetadata;
      previewUrl: string | null;
      previewText: string | null;
    }
  | { kind: "error"; message: string };

const neutralButtonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70";

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
  const parentPrefix = getParentPrefix(prefix);

  async function handleCopyPath() {
    if (!bucket) {
      return;
    }

    const fullPath = prefix ? `${bucket}/${prefix}` : bucket;

    try {
      await navigator.clipboard.writeText(fullPath);
      setActionMessage("Path copied.");
    } catch {
      setActionMessage("Could not copy the path.");
    }
  }

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

      const metadata = payload as S3ObjectMetadata;
      const inlineUrl =
        isImageObject(metadata) || isTextBasedObject(metadata)
          ? await fetchPresignedUrl(bucket, object.key, "inline")
          : null;
      const previewUrl = isImageObject(metadata) ? inlineUrl : null;
      const previewText =
        inlineUrl && isTextBasedObject(metadata)
          ? await fetchTextPreview(inlineUrl)
          : null;

      setMetadataState({
        kind: "object",
        metadata,
        previewUrl,
        previewText,
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

  function handleOpenFolder(folder: S3BrowserFolder) {
    router.push(buildBrowserHref(bucket, folder.prefix));
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

  async function handleOpenPdfInNewTab() {
    if (metadataState.kind !== "object" || !isPdfObject(metadataState.metadata)) {
      return;
    }

    try {
      const url = await fetchPresignedUrl(
        metadataState.metadata.bucket,
        metadataState.metadata.key,
        "inline",
      );
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Could not open the PDF.",
      );
    }
  }

  return (
    <>
      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white px-7 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="grid gap-2.5">
          <strong className="text-[1.05rem] font-semibold text-slate-900">
            Current path
          </strong>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="inline-flex text-blue-600">
              <FolderPathIcon />
            </span>
            <div className="flex min-w-0 flex-wrap gap-2 leading-7 text-slate-500">
              <Link
                className="text-blue-600 hover:text-blue-700"
                href={bucket ? buildBrowserHref(bucket) : "/browser"}
              >
                {bucket || "No bucket selected"}
              </Link>
              {breadcrumbSegments.map((segment) => (
                <Link
                  className="text-blue-600 hover:text-blue-700"
                  href={buildBrowserHref(bucket, segment.prefix)}
                  key={segment.prefix}
                >
                  / {segment.name}
                </Link>
              ))}
            </div>
            <button
              className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              onClick={() => {
                void handleCopyPath();
              }}
              title="Copy current path"
              type="button"
            >
              <CopyIcon />
            </button>
          </div>
          {actionMessage ? (
            <p className="max-w-[320px] text-[0.82rem] leading-6 text-slate-500">
              {actionMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <UploadControl
            bucket={bucket}
            disabled={!bucket || Boolean(listingError)}
            prefix={prefix}
          />
          <button
            className={neutralButtonClass}
            disabled={!bucket || isBusy}
            onClick={() => {
              void handleCreateFolder();
            }}
            type="button"
          >
            <CreateFolderIcon />
            Create folder
          </button>
          <button
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-70"
            disabled={!selection || isBusy}
            onClick={() => {
              void handleDeleteSelected();
            }}
            type="button"
          >
            <span className="text-red-500">
              <TrashIcon />
            </span>
            Delete selected
          </button>
        </div>
      </section>

      <section className="grid gap-6 [grid-template-columns:minmax(0,1.7fr)_minmax(280px,0.8fr)] max-[1080px]:grid-cols-1">
        <div className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[1.15rem] font-semibold text-slate-900">Objects</h2>
            <span className="text-sm text-slate-500">
              {listing ? `${entryCount} visible entries` : "not loaded"}
            </span>
          </div>

          {listingError ? (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-5 leading-7 text-red-600">
              {listingError}
            </div>
          ) : !bucket ? (
            <div className="rounded-[20px] border border-dashed border-slate-300 px-5 py-5 leading-7 text-slate-500">
              No bucket selected yet. Choose a bucket from the left sidebar.
            </div>
          ) : listing && entryCount > 0 ? (
            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[minmax(0,2fr)_120px_130px_110px] items-center gap-4 border-b border-slate-200 px-4 pb-3 pt-1 text-[0.86rem] uppercase tracking-[0.08em] text-slate-500 max-[720px]:grid-cols-1">
                <span>Name</span>
                <span>Size</span>
                <span>Updated</span>
                <span>Action</span>
              </div>

              {parentPrefix !== null ? (
                <div className="grid cursor-pointer grid-cols-[minmax(0,2fr)_120px_130px_110px] items-center gap-4 border-b border-slate-200/80 px-4 py-3.5 max-[720px]:grid-cols-1">
                  <Link
                    className="block"
                    href={buildBrowserHref(bucket, parentPrefix)}
                    title="Go to parent folder"
                  >
                    <div className="grid min-w-0 gap-1">
                      <strong className="text-[0.95rem] font-semibold text-slate-900">
                        ..
                      </strong>
                      <span className="truncate text-[0.88rem] text-slate-500">
                        &nbsp;
                      </span>
                    </div>
                  </Link>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : null}

              {listing.folders.map((folder) => {
                const isSelected =
                  selection?.type === "folder" && selection.key === folder.prefix;

                return (
                  <div
                    className={`grid cursor-pointer grid-cols-[minmax(0,2fr)_120px_130px_110px] items-center gap-4 border-b border-slate-200/80 px-4 py-3.5 transition max-[720px]:grid-cols-1 ${
                      isSelected ? "bg-sky-50" : "hover:bg-sky-50/70"
                    }`}
                    key={folder.key}
                    onClick={() => {
                      handleSelectFolder(folder);
                    }}
                    onDoubleClick={() => {
                      handleOpenFolder(folder);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSelectFolder(folder);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="grid min-w-0 gap-1">
                      <strong
                        className="truncate text-[0.95rem] font-semibold text-slate-900"
                        title="Double-click to open"
                      >
                        {folder.name}/
                      </strong>
                      <span className="truncate text-[0.88rem] text-slate-500">
                        {folder.prefix}
                      </span>
                    </div>
                    <span>-</span>
                    <span>-</span>
                    <span>-</span>
                  </div>
                );
              })}

              {listing.objects.map((object) => {
                const isSelected =
                  selection?.type === "object" && selection.key === object.key;

                return (
                  <div
                    className={`grid cursor-pointer grid-cols-[minmax(0,2fr)_120px_130px_110px] items-center gap-4 border-b border-slate-200/80 px-4 py-3.5 transition last:border-b-0 max-[720px]:grid-cols-1 ${
                      isSelected ? "bg-sky-50" : "hover:bg-sky-50/70"
                    }`}
                    key={object.key}
                    onClick={() => {
                      handleSelectObject(object);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSelectObject(object);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="grid min-w-0 gap-1">
                      <strong className="truncate text-[0.95rem] font-semibold text-slate-900">
                        {object.name}
                      </strong>
                      <span className="truncate text-[0.88rem] text-slate-500">
                        {object.key}
                      </span>
                    </div>
                    <span>{formatBytes(object.size)}</span>
                    <span>{formatDate(object.lastModified)}</span>
                    <div className="flex flex-wrap justify-start gap-2">
                      <DownloadButton
                        bucket={bucket}
                        objectKey={object.key}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-slate-300 px-5 py-5 leading-7 text-slate-500">
              This location is empty. Upload a file here or create a folder.
            </div>
          )}
        </div>

        <aside className="grid h-fit gap-5 self-start rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[1.15rem] font-semibold text-slate-900">
                Information
              </h2>
            </div>
          </div>

          {metadataState.kind === "idle" ? (
            <div className="rounded-[20px] border border-dashed border-slate-300 px-5 py-5 leading-7 text-slate-500">
              Select a file or folder from the list to show its information here.
            </div>
          ) : metadataState.kind === "loading" ? (
            <div className="rounded-[20px] border border-dashed border-slate-300 px-5 py-5 leading-7 text-slate-500">
              Loading file information and preview...
            </div>
          ) : metadataState.kind === "error" ? (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-5 leading-7 text-red-600">
              {metadataState.message}
            </div>
          ) : metadataState.kind === "folder" ? (
            <dl className="grid gap-3">
              <MetaRow label="Type" value="Folder" />
              <MetaRow label="Name" value={`${metadataState.folder.name}/`} />
              <MetaRow label="Prefix" value={metadataState.folder.prefix} />
              <MetaRow label="Bucket" value={bucket || "-"} />
            </dl>
          ) : (
            <>
              {metadataState.previewUrl ? (
                <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={metadataState.metadata.key}
                    className="block max-h-[280px] w-full object-contain"
                    src={metadataState.previewUrl}
                  />
                </div>
              ) : null}

              {metadataState.previewText ? (
                <div className="max-h-[320px] overflow-auto rounded-[20px] border border-slate-200 bg-[#f7f3ea] p-3.5">
                  <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[0.83rem] leading-6 text-slate-900">
                    {metadataState.previewText}
                  </pre>
                </div>
              ) : null}

              {isPdfObject(metadataState.metadata) ? (
                <button
                  className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700"
                  onClick={() => {
                    void handleOpenPdfInNewTab();
                  }}
                  type="button"
                >
                  Open PDF
                </button>
              ) : null}

              <dl className="grid gap-3">
                <MetaRow label="Bucket" value={metadataState.metadata.bucket} />
                <MetaRow label="Key" value={metadataState.metadata.key} />
                <MetaRow
                  label="Size"
                  value={
                    metadataState.metadata.contentLength === null
                      ? "-"
                      : formatBytes(metadataState.metadata.contentLength)
                  }
                />
                <MetaRow
                  label="Type"
                  value={metadataState.metadata.contentType || "-"}
                />
                <MetaRow label="ETag" value={metadataState.metadata.etag || "-"} />
                <MetaRow
                  label="Updated"
                  value={formatDate(metadataState.metadata.lastModified)}
                />
                <MetaRow
                  label="Metadata"
                  value={
                    Object.keys(metadataState.metadata.metadata).length
                      ? JSON.stringify(metadataState.metadata.metadata)
                      : "-"
                  }
                />
              </dl>
            </>
          )}
        </aside>
      </section>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-slate-200/80 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words text-slate-900">{value}</dd>
    </div>
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

function getParentPrefix(prefix: string) {
  if (!prefix) {
    return null;
  }

  const parts = prefix.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return "";
  }

  return `${parts.slice(0, -1).join("/")}/`;
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

async function fetchPresignedUrl(
  bucket: string,
  key: string,
  disposition: "attachment" | "inline",
) {
  const params = new URLSearchParams({
    bucket,
    key,
    disposition,
  });
  const response = await fetch(`/api/downloads/presign?${params.toString()}`);
  const payload = (await response.json()) as { error?: string; url?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Could not prepare the file URL.");
  }

  return payload.url;
}

function isImageObject(metadata: S3ObjectMetadata) {
  const contentType = metadata.contentType?.toLowerCase() || "";
  const key = metadata.key.toLowerCase();

  if (contentType.startsWith("image/")) {
    return true;
  }

  return [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
    ".svg",
    ".ico",
    ".avif",
  ].some((extension) => key.endsWith(extension));
}

function isPdfObject(metadata: S3ObjectMetadata) {
  return (
    metadata.contentType === "application/pdf" ||
    metadata.key.toLowerCase().endsWith(".pdf")
  );
}

function isTextBasedObject(metadata: S3ObjectMetadata) {
  const contentType = metadata.contentType?.toLowerCase() || "";
  const key = metadata.key.toLowerCase();

  if (contentType.startsWith("text/")) {
    return true;
  }

  return [
    ".txt",
    ".log",
    ".md",
    ".json",
    ".csv",
    ".xml",
    ".yaml",
    ".yml",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".html",
  ].some((extension) => key.endsWith(extension));
}

async function fetchTextPreview(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load the text preview.");
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return "(empty file)";
  }

  return trimmed.length > 12000 ? `${trimmed.slice(0, 12000)}\n\n[truncated]` : trimmed;
}

function FolderPathIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.75 8.25C3.75 7.00736 4.75736 6 6 6H9.5L11.25 8H18C19.2426 8 20.25 9.00736 20.25 10.25V16.5C20.25 17.7426 19.2426 18.75 18 18.75H6C4.75736 18.75 3.75 17.7426 3.75 16.5V8.25Z"
        stroke="#2563EB"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 9.75C9 8.50736 10.0074 7.5 11.25 7.5H17.25C18.4926 7.5 19.5 8.50736 19.5 9.75V15.75C19.5 16.9926 18.4926 18 17.25 18H11.25C10.0074 18 9 16.9926 9 15.75V9.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6.75 14.25H6C4.75736 14.25 3.75 13.2426 3.75 12V6C3.75 4.75736 4.75736 3.75 6 3.75H12C13.2426 3.75 14.25 4.75736 14.25 6V6.75"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CreateFolderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.75 8.25C3.75 7.00736 4.75736 6 6 6H9.5L11.25 8H18C19.2426 8 20.25 9.00736 20.25 10.25V16.5C20.25 17.7426 19.2426 18.75 18 18.75H6C4.75736 18.75 3.75 17.7426 3.75 16.5V8.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M12 10.5V15M9.75 12.75H14.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.25 7.5H18.75M9.75 3.75H14.25M10.5 10.5V15.75M13.5 10.5V15.75M6.75 7.5L7.5 18C7.57128 18.998 8.40239 19.75 9.40295 19.75H14.597C15.5976 19.75 16.4287 18.998 16.5 18L17.25 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
