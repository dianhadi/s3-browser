import { appConfig } from "@/lib/config";
import styles from "./page.module.css";

export default function LoginPage() {
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
              Placeholder for Phase 2. This form will validate the endpoint and
              create an encrypted session without storing credentials in a
              database.
            </p>
          </div>

          <form className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="endpoint">Endpoint</label>
              <input
                id="endpoint"
                name="endpoint"
                placeholder="http://127.0.0.1:9000"
                disabled
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  name="region"
                  placeholder="us-east-1"
                  disabled
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="addressingStyle">Addressing style</label>
                <select id="addressingStyle" name="addressingStyle" disabled>
                  <option>Path-style</option>
                  <option>Virtual-hosted</option>
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
                  disabled
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="secretAccessKey">Secret key</label>
                <input
                  id="secretAccessKey"
                  name="secretAccessKey"
                  placeholder="••••••••"
                  type="password"
                  disabled
                />
              </div>
            </div>

            <p className={styles.hint}>
              Phase 2 will enable endpoint validation, credential checks, and
              encrypted session cookie creation.
            </p>

            <div className={styles.actions}>
              <p className={styles.actionMeta}>
                The browser placeholder route is ready at <code>/browser</code>.
              </p>
              <button className={styles.submitButton} type="button" disabled>
                Sign in in Phase 2
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
