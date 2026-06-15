"use client";

import { useState } from "react";

type DownloadButtonProps = {
  bucket: string;
  objectKey: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function DownloadButton({
  bucket,
  objectKey,
  onClick,
}: DownloadButtonProps) {
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
      className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700 disabled:cursor-wait disabled:opacity-70"
      disabled={isPending}
      onClick={(event) => {
        onClick?.(event);
        void handleDownload();
      }}
      type="button"
    >
      {isPending ? "Preparing..." : "Download"}
    </button>
  );
}
