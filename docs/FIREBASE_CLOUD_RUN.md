# Firebase and Cloud Run setup

OpenDM uses Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Run, and Cloud Tasks. No Supabase or PostgreSQL service is required.

## Firebase

1. Create a Firebase project and register a Web App.
2. Enable **Google** in Firebase Authentication. Configure the OAuth consent screen and authorized domains for local and production use.
3. Create Firestore in Production mode and deploy `firestore.rules` and `firestore.indexes.json` using the Firebase CLI.
4. Create Cloud Storage and deploy `storage.rules`.
5. Fill the Firebase values in local `.env`; do not commit it.

## Google-only authentication

OpenDM uses Firebase Authentication's Google provider only. Keep **Google** enabled in Firebase Console → Authentication → Sign-in method. In Authentication → Settings → Authorized domains, add `localhost` for local testing and add the eventual production hostname before deployment. The login UI creates the normal HttpOnly OpenDM session only after Firebase completes Google sign-in.

## Cloud Run and Cloud Tasks

Deploy the web/API service and a worker service in the same region as Firestore. Attach a dedicated Cloud Run service account; never upload a service-account JSON key. Create the `opendm-automation` Cloud Tasks queue and set `CLOUD_TASKS_LOCATION`, `CLOUD_TASKS_QUEUE`, `CLOUD_TASKS_WORKER_URL`, and a Secret-Manager-backed `CLOUD_TASKS_WORKER_TOKEN`.

Start with max instances 3, min instances 0, webhook concurrency higher than worker concurrency, and conservative queue dispatch/concurrency limits. Cloud Tasks is at-least-once, so OpenDM keeps event/delivery deduplication and retries. Alert on task age, task failures, Cloud Run error rate, Firestore operations, and billing budget thresholds. A rate-limited task remains queued; it is not discarded.

## Required secrets

Store `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, Meta secrets, and Cloud Tasks secrets in Secret Manager / Cloud Run secret bindings. The Firebase Web App config is public configuration, not a server credential.
