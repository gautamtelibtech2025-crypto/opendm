# OpenDM

OpenDM is a multi-tenant Instagram automation SaaS foundation based on [open-autoDM](https://github.com/harshithgangone/open-autodm). The upstream MIT license and attribution are retained in [LICENSE](LICENSE).

It preserves the original comment-to-DM, DM keyword, Story Reply, follow-first, encrypted Instagram OAuth-token, Meta webhook, deduplication, retry, rate-limit, and safety-circuit-breaker workflows.

## Platform

- Firebase Authentication: Google Sign-In only.
- Cloud Firestore: tenant-owned customers, Instagram accounts, automations, contacts, sessions, logs, plans, subscriptions, usage, and admin audit records.
- Firebase Storage: customer card images.
- Cloud Run + Cloud Tasks: webhook/API and durable automation-worker architecture.
- One OpenDM-owned Meta Developer App: customers authorize only their own Instagram Professional accounts.

## Local setup

```powershell
npm install
Copy-Item .env.example .env
# Fill the Firebase, Meta, and encryption values in .env
npm run dev
```

Detailed configuration is in [docs/FIREBASE_CLOUD_RUN.md](docs/FIREBASE_CLOUD_RUN.md). Firestore rules and index definitions are in `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## Verification

```powershell
npm run typecheck
npm run build
```

External Firebase, Cloud Tasks, and Meta delivery testing requires their respective project credentials and approved/test accounts. See [docs/TESTING.md](docs/TESTING.md).

## License

MIT. See [LICENSE](LICENSE). OpenDM is not affiliated with Meta or Instagram.
