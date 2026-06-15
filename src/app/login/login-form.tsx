"use client";

import { useActionState } from "react";
import { useState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = {
  fields: {
    endpoint: "",
    region: "us-east-1",
    accessKeyId: "",
    addressingStyle: "path",
  },
};

const fieldClassName =
  "h-[50px] w-full rounded-[6px] border border-slate-200 bg-white px-4 py-3 text-[0.98rem] leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
const labelClassName = "text-[0.92rem] font-semibold leading-[1.35] text-slate-900";
const groupClassName = "grid gap-2";
const gridClassName = "grid gap-4 sm:grid-cols-2";
const formClassName = "grid gap-6";
const submitClassName =
  "inline-flex h-[50px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-blue-600 px-5 text-[1rem] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-80";
const errorClassName =
  "rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-[0.92rem] leading-6 text-red-600";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [showSecret, setShowSecret] = useState(false);

  return (
    <form action={formAction} className={formClassName}>
      <div className={groupClassName}>
        <label className={labelClassName} htmlFor="endpoint">
          Endpoint
        </label>
        <input
          autoComplete="url"
          className={fieldClassName}
          defaultValue={state.fields?.endpoint}
          id="endpoint"
          name="endpoint"
          placeholder="http://127.0.0.1:9000"
        />
      </div>

      <div className={gridClassName}>
        <div className={groupClassName}>
          <label className={labelClassName} htmlFor="region">
            Region
          </label>
          <input
            autoComplete="off"
            className={fieldClassName}
            defaultValue={state.fields?.region}
            id="region"
            name="region"
            placeholder="us-east-1"
          />
        </div>
        <div className={groupClassName}>
          <label className={labelClassName} htmlFor="addressingStyle">
            Addressing style
          </label>
          <select
            className={`${fieldClassName} pr-10`}
            defaultValue={state.fields?.addressingStyle}
            id="addressingStyle"
            name="addressingStyle"
          >
            <option value="path">Path-style</option>
            <option value="virtual">Virtual-hosted</option>
          </select>
        </div>
      </div>

      <div className={gridClassName}>
        <div className={groupClassName}>
          <label className={labelClassName} htmlFor="accessKeyId">
            Access key
          </label>
          <input
            autoComplete="username"
            className={fieldClassName}
            defaultValue={state.fields?.accessKeyId}
            id="accessKeyId"
            name="accessKeyId"
            placeholder="minioadmin"
          />
        </div>
        <div className={groupClassName}>
          <label className={labelClassName} htmlFor="secretAccessKey">
            Secret key
          </label>
          <div className="relative">
            <input
              autoComplete="current-password"
              className={`${fieldClassName} pr-11`}
              id="secretAccessKey"
              name="secretAccessKey"
              placeholder="Enter secret key"
              type={showSecret ? "text" : "password"}
            />
            <button
              aria-label={showSecret ? "Hide secret key" : "Show secret key"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowSecret((value) => !value)}
              type="button"
            >
              <EyeIcon />
            </button>
          </div>
        </div>
      </div>

      {state.error ? (
        <p className={errorClassName}>
          {state.error}
        </p>
      ) : null}

      <div className="pt-1">
        <button
          className={submitClassName}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.25 12C3.99 8.55 7.59 6.25 12 6.25C16.41 6.25 20.01 8.55 21.75 12C20.01 15.45 16.41 17.75 12 17.75C7.59 17.75 3.99 15.45 2.25 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
