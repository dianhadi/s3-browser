"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700 hover:shadow-[0_10px_20px_rgba(37,99,235,0.18)] disabled:cursor-wait disabled:opacity-70"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      type="button"
    >
      <RefreshIcon />
      {isPending ? "Refreshing..." : "Refresh"}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 11.5C20 7.35786 16.6421 4 12.5 4C9.45519 4 6.83436 5.81157 5.6403 8.41667M4 6V9.16667H7.16667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M4 12.5C4 16.6421 7.35786 20 11.5 20C14.5448 20 17.1656 18.1884 18.3597 15.5833M20 18V14.8333H16.8333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
