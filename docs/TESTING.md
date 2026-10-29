# Testing OpenDM

Run `npm run typecheck` and `npm run build` before deployment. For Firebase integration testing, configure the Firebase Emulator Suite or an isolated Firebase project, then test two customer accounts and two Instagram connections.

- Google sign-in: enable the provider, authorize the local domain, complete Google consent, and verify redirect to `/dashboard` with a secure session cookie.
- Tenant isolation: request another user's account, automation, contact, and admin endpoints with a valid customer ID token; each must be denied.
- Admin: set the initial email in `OPENDM_ADMIN_EMAILS`, sign in, then verify a normal account cannot access `/admin` or admin API responses.
- Instagram: Meta development/tester accounts are required for real delivery. Webhook HMAC, duplicate delivery, and actual follower-status verification must be tested against Meta; no local simulation proves real delivery.
