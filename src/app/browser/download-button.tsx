"use client";

import { useState } from "react";
import styles from "./page.module.css";

type DownloadButtonProps = {
  bucket: string;
  objectKey: string;
};

export function DownloadButton({ bucket, objectKey }: DownloadButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleDownload() {
    setIsPending(true);

    try {
      const params = new URLSearchParams({
        bucket,
        key: objectKey,
      });
      const response = await fetch(`/api/downloads/presign?${params.toString()}`);
      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not prepare the download.");
      }

      const link = document.createElement("a");
      link.href = payload.url;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "The download could not be started.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      className={styles.inlineActionButton}
      disabled={isPending}
      onClick={() => {
        void handleDownload();
      }}
      type="button"
    >
      {isPending ? "Preparing..." : "Download"}
    </button>
  );
}
