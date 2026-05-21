"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";
import styles from "./page.module.css";

const initialState: LoginActionState = {
  fields: {
    endpoint: "",
    region: "us-east-1",
    accessKeyId: "",
    addressingStyle: "path",
  },
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form className={styles.grid} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="endpoint">Endpoint</label>
        <input
          id="endpoint"
          name="endpoint"
          placeholder="http://127.0.0.1:9000"
          defaultValue={state.fields?.endpoint}
          autoComplete="url"
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label htmlFor="region">Region</label>
          <input
            id="region"
            name="region"
            placeholder="us-east-1"
            defaultValue={state.fields?.region}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="addressingStyle">Addressing style</label>
          <select
            id="addressingStyle"
            name="addressingStyle"
            defaultValue={state.fields?.addressingStyle}
          >
            <option value="path">Path-style</option>
            <option value="virtual">Virtual-hosted</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label htmlFor="accessKeyId">Access key</label>
          <input
            id="accessKeyId"
            name="accessKeyId"
            placeholder="minioadmin"
            defaultValue={state.fields?.accessKeyId}
            autoComplete="username"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="secretAccessKey">Secret key</label>
          <input
            id="secretAccessKey"
            name="secretAccessKey"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
          />
        </div>
      </div>

      <p className={styles.hint}>
        Provide a full endpoint URL with protocol. Example:{" "}
        <code>http://127.0.0.1:9000</code> or{" "}
        <code>https://minio.internal.example.com</code>.
      </p>

      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.actions}>
        <p className={styles.actionMeta}>
          Credentials are only kept in an encrypted HTTP-only session cookie.
        </p>
        <button className={styles.submitButton} type="submit" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
