"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinObjectKey } from "@/lib/s3";

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

      await uploadWithProgress(payload.url, file, (progress) => {
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
    <div className="grid self-start gap-1.5">
      <input
        className="hidden"
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
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-700 disabled:cursor-wait disabled:opacity-70"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <UploadIcon />
        {state.kind === "progress" ? `Uploading ${state.progress}%` : "Upload file"}
      </button>
      <p className="max-w-[280px] text-[0.82rem] leading-6 text-slate-500">
        {state.kind === "progress"
          ? `${state.fileName} is uploading.`
          : state.kind === "success"
            ? state.message
            : state.kind === "error"
              ? state.message
              : ""}
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

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 16V5M12 5L8 9M12 5L16 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 18.5C5 17.6716 5.67157 17 6.5 17H17.5C18.3284 17 19 17.6716 19 18.5C19 19.3284 18.3284 20 17.5 20H6.5C5.67157 20 5 19.3284 5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
