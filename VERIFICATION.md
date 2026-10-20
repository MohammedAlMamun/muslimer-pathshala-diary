# Verification report — v0.2

Date: 20 October 2026 (Europe/Madrid)

## Passed locally

- JavaScript syntax: `app.js`, `config.js`, `config.example.js`.
- Production mode: the frontend is configured for the dedicated Supabase project using its public publishable key.
- Parent consent gate: consent required before diary access and retained after reload in QA mode.
- Parent diary: learner answer saved and remained after a full page reload.
- Teacher view: exact learner answer appeared in a read-only answer screen.
- Note isolation: unshared family note was absent from teacher view; after explicit sharing it appeared.
- Parent diary isolation: teacher view did not expose the family diary form/answers.
- Three level cards rendered, each showing a five-student capacity.
- Responsive check at 390 × 844: no document-level horizontal overflow.
- Weekly matrix: horizontal overflow stayed inside its dedicated scroll container.
- Browser console: no errors or warnings during the tested flow.
- Supabase client CDN URL: pinned `@supabase/supabase-js` v2.75.0 responded successfully.
- SQL execution: all nine tables, functions, triggers and policies executed in an in-memory PostgreSQL-compatible test database.
- Database capacity: sixth active learner in the same level was rejected; count remained five.
- Answer validation: an unknown answer key was rejected.
- RLS simulation:
  - parent saw one own learner/entry/family entry;
  - teacher saw one assigned learner/entry;
  - teacher saw zero private family entries;
  - teacher saw one explicitly shared note;
  - teacher insert into learner entries was rejected.

## Passed in the hosted Supabase project

- Dedicated EU-region project is healthy.
- All nine pilot tables were installed and returned `relrowsecurity = true`.
- The nightly `muslimer-pathshala-90-day-retention` Cron job was created with schedule `17 3 * * *` UTC.
- The teacher email `muslimerpathshala@gmail.com` was invited and linked to an active `teacher` profile for Mohammed Al Mamun.

## Passed on the live GitHub Pages deployment

- Public repository created at `https://github.com/MohammedAlMamun/muslimer-pathshala-diary`.
- GitHub Pages publishes from `main` at `https://mohammedalmamun.github.io/muslimer-pathshala-diary/` with HTTPS enforced.
- The live page renders the invited-email sign-in screen; the logo, stylesheet, configuration and application script load successfully.
- Supabase Site URL and the one allowed redirect URL exactly match the live HTTPS address.
- The live browser console showed no errors or warnings before sign-in.
- An unknown email was rejected with sign-up disabled; no account was created.

## Still required with pilot accounts

- Invite each pilot parent and run a filled local onboarding file for that family.
- Repeat the two-account RLS smoke test against the real hosted database.

These remaining steps require the participating families' chosen emails and learner aliases.
