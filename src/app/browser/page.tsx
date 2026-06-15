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
import { RefreshButton } from "./refresh-button";

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
    <main className="grid min-h-screen grid-cols-[310px_1fr] bg-white max-[1080px]:grid-cols-1">
      <aside className="grid auto-rows-max content-start gap-6 border-r border-slate-200/80 bg-white/90 px-5 py-7 max-[1080px]:border-b max-[1080px]:border-r-0">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-[14px]">
            <LogoIcon />
          </div>
          <div>
            <h1 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-slate-900">
              {appConfig.appName}
            </h1>
            <p className="mt-1 leading-6 text-slate-500">Browse your S3 storage</p>
          </div>
        </div>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[0.92rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Buckets
            </h2>
            <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-slate-100 px-2 text-[0.82rem] font-bold text-slate-600">
              {buckets.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            {buckets.length ? (
              buckets.map((bucket) => {
                const isActive = bucket.name === activeBucket;

                return (
                  <Link
                    className={`grid grid-cols-[auto_1fr] items-center gap-3 border-b border-slate-200/70 px-4 py-3.5 transition last:border-b-0 ${
                      isActive ? "bg-blue-50" : "bg-white hover:bg-blue-50/60"
                    }`}
                    href={buildBrowserHref(bucket.name)}
                    key={bucket.name}
                  >
                    <div className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-blue-50">
                      <BucketIcon />
                    </div>
                    <div className="grid min-w-0 gap-1">
                      <strong className="truncate text-[0.95rem] font-semibold text-blue-600">
                        {bucket.name}
                      </strong>
                      <span className="text-[0.88rem] text-slate-500">
                        {formatCreatedAt(bucket.createdAt)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-4 text-[0.92rem] text-slate-500">
                No buckets available.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[0.84rem] font-bold uppercase tracking-[0.08em] text-slate-500">
            Endpoint
          </h2>
          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="grid place-items-start pt-0.5">
              <EndpointIcon />
            </div>
            <div className="grid gap-1.5 text-[0.88rem] text-slate-500">
              <span>
                {summary.protocol.toUpperCase()}
                {summary.port ? `:${summary.port}` : ""}
                {" / "}
                {summary.hostname}
              </span>
              <span className="break-all">{summary.endpoint}</span>
              <span>
                {getAddressingStyleLabel(session.addressingStyle)} /{" "}
                {maskAccessKey(session.accessKeyId)}
              </span>
            </div>
          </div>
        </section>

        <form action={logoutAction}>
          <button
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50"
            type="submit"
          >
            <span className="inline-flex text-slate-500">
              <SignOutIcon />
            </span>
            Sign out
          </button>
        </form>
      </aside>

      <section className="grid grid-rows-[auto_auto_1fr] gap-6 px-8 py-7 max-[1080px]:px-5 max-[1080px]:py-5">
        <header className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:items-start">
          <div>
            <h2 className="text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Bucket browser
            </h2>
            <p className="mt-1.5 leading-7 text-slate-500">
              Browse folders and objects directly from the connected
              S3-compatible storage.
            </p>
          </div>
          <RefreshButton />
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

function LogoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[26px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V7H18C19.6569 7 21 8.34315 21 10V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V10C3 8.34315 4.34315 7 6 7H7.5V6.5Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M8.75 7V6.5C8.75 4.70507 10.2051 3.25 12 3.25C13.7949 3.25 15.25 4.70507 15.25 6.5V7"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.25 13.25C9.25 11.7312 10.4812 10.5 12 10.5C13.5188 10.5 14.75 11.7312 14.75 13.25V15.25C14.75 16.7688 13.5188 18 12 18C10.4812 18 9.25 16.7688 9.25 15.25V13.25Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="logo-gradient"
          x1="3"
          x2="21"
          y1="2"
          y2="22"
        >
          <stop stopColor="#5C94FF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BucketIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 8.5C4 7.11929 5.11929 6 6.5 6H17.5C18.8807 6 20 7.11929 20 8.5V17.5C20 18.8807 18.8807 20 17.5 20H6.5C5.11929 20 4 18.8807 4 17.5V8.5Z"
        fill="#EAF1FF"
      />
      <path
        d="M7 8.5H17M9 6V5.25C9 4.00736 10.0074 3 11.25 3H12.75C13.9926 3 15 4.00736 15 5.25V6"
        stroke="#2563EB"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9 11L9.6 16.1C9.68253 16.8015 10.2768 17.33 10.9832 17.33H13.0168C13.7232 17.33 14.3175 16.8015 14.4 16.1L15 11"
        stroke="#2563EB"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EndpointIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="8.25" stroke="#6D7890" strokeWidth="1.5" />
      <path
        d="M12 3.75C9.92893 5.95348 8.75 8.90924 8.75 12C8.75 15.0908 9.92893 18.0465 12 20.25C14.0711 18.0465 15.25 15.0908 15.25 12C15.25 8.90924 14.0711 5.95348 12 3.75Z"
        stroke="#6D7890"
        strokeWidth="1.5"
      />
      <path d="M4 12H20" stroke="#6D7890" strokeWidth="1.5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6.5V5.5C10 4.39543 10.8954 3.5 12 3.5H17.5C18.6046 3.5 19.5 4.39543 19.5 5.5V18.5C19.5 19.6046 18.6046 20.5 17.5 20.5H12C10.8954 20.5 10 19.6046 10 18.5V17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 12H14.5M11 8.5L14.5 12L11 15.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
