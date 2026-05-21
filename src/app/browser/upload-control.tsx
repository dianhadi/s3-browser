"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinObjectKey } from "@/lib/s3";
import styles from "./page.module.css";

type UploadControlProps = {
  bucket: string;
  prefix: string;
  disabled?: boolean;
};

type UploadState =
  | { kind: "idle" }
  | { kind: "progress"; fileName: string; progress: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function UploadControl({
  bucket,
  prefix,
  disabled = false,
}: UploadControlProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, startTransition] = useTransition();
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  const isDisabled = disabled || !bucket || isRefreshing;

  async function handleFileSelected(file: File) {
    const key = joinObjectKey(prefix, file.name);

    setState({
      kind: "progress",
      fileName: file.name,
      progress: 0,
    });

    let presigned: { url: string } | null = null;

    try {
      const response = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket,
          key,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not prepare the upload.");
      }

      presigned = { url: payload.url };
      await uploadWithProgress(presigned.url, file, (progress) => {
        setState({
          kind: "progress",
          fileName: file.name,
          progress,
        });
      });

      setState({
        kind: "success",
        message: `Uploaded ${file.name} successfully.`,
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "The upload could not be completed.",
      });
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className={styles.transferControl}>
      <input
        className={styles.hiddenInput}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void handleFileSelected(file);
          }
        }}
        ref={inputRef}
        type="file"
      />
      <button
        className={styles.toolbarButton}
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {state.kind === "progress" ? `Uploading ${state.progress}%` : "Upload file"}
      </button>
      <p className={styles.transferMessage}>
        {state.kind === "progress"
          ? `${state.fileName} is uploading.`
          : state.kind === "success"
            ? state.message
            : state.kind === "error"
              ? state.message
              : bucket
                ? "Uploads use presigned PUT URLs and refresh the listing after success."
                : "Select a bucket before uploading."}
      </p>
    </div>
  );
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error("The storage service rejected the upload."));
    };

    xhr.onerror = () => {
      reject(new Error("A network error interrupted the upload."));
    };

    xhr.send(file);
  });
}
