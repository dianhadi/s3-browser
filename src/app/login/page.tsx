import { appConfig } from "@/lib/config";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/browser");
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] overflow-hidden bg-white shadow-[0_24px_80px_rgba(27,36,48,0.08)] lg:grid-cols-[460px_minmax(0,1fr)]">
        <section className="relative bg-[linear-gradient(180deg,#2f67f5_0%,#1f57ea_100%)] text-white">
          <div className="grid gap-12 px-12 py-10 md:px-14 md:py-12 lg:px-16 lg:py-14">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/18">
                <LogoIcon />
              </div>
              <h1 className="text-[2.6rem] font-semibold tracking-[-0.06em]">
                {appConfig.appName}
              </h1>
            </div>

            <div className="space-y-5">
              <p className="max-w-[28rem] text-[1rem] leading-8 text-blue-50/92">
                Connect to your S3-compatible storage and manage files from one place.
              </p>
              <p className="max-w-[30rem] text-sm leading-7 text-blue-100/80">
                Works with custom endpoints, localhost, local networks, and both
                path-style or virtual-hosted addressing.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.16),transparent_60%)]" />
        </section>

        <section className="relative flex items-center justify-center bg-white px-5 py-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(37,99,235,0.08),transparent_58%)]" />
          <div className="relative z-10 w-full max-w-[620px] border border-slate-200 bg-white px-8 py-8 shadow-[0_20px_60px_rgba(27,36,48,0.08)] md:px-10 md:py-10">
            <div className="mb-8 grid gap-3 lg:mb-9">
              <h2 className="text-[2.5rem] font-semibold tracking-[-0.06em] text-slate-900 max-[640px]:text-[2.1rem]">
                Welcome back
              </h2>
              <p className="text-[0.98rem] leading-7 text-slate-500">
                Sign in to connect to your S3-compatible storage.
              </p>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

function LogoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 8.2C5 6.985 5.985 6 7.2 6H16.8C18.015 6 19 6.985 19 8.2V15.8C19 17.015 18.015 18 16.8 18H7.2C5.985 18 5 17.015 5 15.8V8.2Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M7.75 8H16.25M9 6V5.4C9 4.627 9.627 4 10.4 4H13.6C14.373 4 15 4.627 15 5.4V6"
        stroke="#2F67F5"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.3 10.7L9.8 14.9C9.861 15.42 10.301 15.81 10.824 15.81H13.176C13.699 15.81 14.139 15.42 14.2 14.9L14.7 10.7"
        stroke="#2F67F5"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
