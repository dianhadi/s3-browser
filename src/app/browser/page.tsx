import { appConfig } from "@/lib/config";
import styles from "./page.module.css";

const placeholderBuckets = [
  { name: "media-archive", objects: "214 objects" },
  { name: "finance-export", objects: "57 objects" },
  { name: "minio-test", objects: "empty" },
];

const placeholderObjects = [
  { name: "reports/", size: "-", updated: "folder" },
  { name: "reports/q1-summary.pdf", size: "1.8 MB", updated: "2026-05-20" },
  { name: "reports/q2-summary.pdf", size: "2.1 MB", updated: "2026-05-18" },
];

export default function BrowserPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1>{appConfig.appName}</h1>
          <p>Browser placeholder for bucket and object navigation.</p>
        </div>

        <section className={styles.bucketPanel}>
          <div className={styles.bucketHeader}>
            <h2>Buckets</h2>
            <span>3</span>
          </div>
          <div className={styles.bucketList}>
            {placeholderBuckets.map((bucket) => (
              <div className={styles.bucketRow} key={bucket.name}>
                <strong>{bucket.name}</strong>
                <span>{bucket.objects}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.quickActions}>
          <div className={styles.quickAction}>
            <strong>Upload</strong>
            <span>Phase 5 will use presigned PUT URLs.</span>
          </div>
          <div className={styles.quickAction}>
            <strong>Download</strong>
            <span>Phase 5 will trigger downloads through presigned GET URLs.</span>
          </div>
          <div className={styles.quickAction}>
            <strong>Metadata</strong>
            <span>Phase 6 will show details for the selected object.</span>
          </div>
        </section>

        <p className={styles.footer}>
          This route is not protected yet. Session guards will be added in
          Phase 2.
        </p>
      </aside>

      <section className={styles.main}>
        <header className={styles.mainHeader}>
          <div>
            <h2>Bucket browser</h2>
            <p className={styles.statusNote}>
              Placeholder UI structure for bucket lists, breadcrumbs, object
              tables, and the metadata panel.
            </p>
          </div>
        </header>

        <section className={styles.toolbar}>
          <div className={styles.toolbarMeta}>
            <strong>Current path</strong>
            <p>/media-archive/reports/</p>
          </div>
          <div className={styles.toolbarActions}>
            <button className={styles.toolbarButton} type="button" disabled>
              Upload file
            </button>
            <button className={styles.toolbarButton} type="button" disabled>
              Create folder
            </button>
            <button className={styles.toolbarButton} type="button" disabled>
              Delete
            </button>
          </div>
        </section>

        <section className={styles.mainContent}>
          <div className={styles.tableCard}>
            <div>
              <div className={styles.mainHeader}>
                <h2>Objects</h2>
                <span>placeholder data</span>
              </div>
              <p className={styles.tableMeta}>
                This phase only prepares the display structure. Real data will
                be connected when the bucket and object listing endpoints are
                available.
              </p>
            </div>

            <div className={styles.objectTable}>
              <div className={styles.tableHeader}>
                <span>Name</span>
                <span>Size</span>
                <span>Updated</span>
              </div>
              {placeholderObjects.map((object) => (
                <div className={styles.objectRow} key={object.name}>
                  <div className={styles.objectCell}>
                    <strong>{object.name}</strong>
                    <span>Placeholder item</span>
                  </div>
                  <span>{object.size}</span>
                  <span>{object.updated}</span>
                </div>
              ))}
            </div>

            <div className={styles.emptyState}>
              Breadcrumbs, empty states, loading states, and selection states
              will be refined in Phase 4 and Phase 6.
            </div>
          </div>

          <aside className={styles.metadataCard}>
            <div>
              <div className={styles.mainHeader}>
                <h2>Metadata</h2>
                <span>preview</span>
              </div>
              <p className={styles.tableMeta}>
                This panel will display `HeadObject` results or metadata for the
                currently selected object.
              </p>
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Bucket</dt>
                <dd>media-archive</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Key</dt>
                <dd>reports/q1-summary.pdf</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>ETag</dt>
                <dd>&quot;placeholder-etag&quot;</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Content-Type</dt>
                <dd>application/pdf</dd>
              </div>
            </dl>
          </aside>
        </section>
      </section>
    </main>
  );
}
