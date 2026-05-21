import { appConfig } from "@/lib/config";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/browser");
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1>{appConfig.appName}</h1>
          <p>
            A browser for S3-compatible storage with custom endpoints,
            virtual-hosted or path-style addressing, and file transfers handled
            through presigned URLs.
          </p>
        </div>
        <div className={styles.heroPoints}>
          <div className={styles.heroPoint}>
            <strong>Flexible connection targets</strong>
            <span>Localhost, internal networks, MinIO, and Nutanix.</span>
          </div>
          <div className={styles.heroPoint}>
            <strong>Database-free sessions</strong>
            <span>Credentials will live in an encrypted cookie session.</span>
          </div>
          <div className={styles.heroPoint}>
            <strong>Secure upload and download flow</strong>
            <span>File transfers will use backend-generated presigned URLs.</span>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Connect to storage</h2>
            <p>
              Sign in with S3-compatible credentials. The app will validate the
              endpoint and create an encrypted session without storing
              credentials in a database.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
