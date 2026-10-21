# Muslimer Pathshala Activity Diary — primary pilot v0.3

A closed, small-scale diary for three learning levels, capped at five active learners per level (15 total). Parents record daily learner/family reflections. The assigned teacher can read learner answers, the guardian's four daily support answers, and only the family notes that a parent explicitly shares. The teacher also has a private daily muhasabah and can publish a separate general message to assigned families.

The production configuration is connected to the dedicated Supabase project and is intended for the public GitHub Pages URL `https://mohammedalmamun.github.io/muslimer-pathshala-diary/`. Diary data remains behind invited-email authentication and database row-level security; the public site does not provide open registration.

## Pilot boundary

- Levels: `tamhidi`, `ibtidai`, `pathshala`.
- Capacity: maximum five active learners in each level, enforced in PostgreSQL.
- Accounts: invited parents and designated teacher only; no open registration.
- Names: use learner aliases, not full legal names.
- Teacher: read-only access to assigned learner answers.
- Guardian support answers: the four daily support answers are visible read-only to the assigned teacher; private guardian comments remain private unless explicitly shared.
- Family notes: visible to the teacher only after an explicit share action.
- Teacher muhasabah: prayer, Qur'an, preparation and private note are visible only to that teacher.
- Teacher updates: families see only a separate message that the teacher explicitly publishes.
- Diary retention: 90-day purge function and optional nightly Cron job.
- No analytics, ads, social login, ranking, or devotional scoring.

## Files

- `index.html`, `styles.css`, `app.js`: static GitHub Pages app.
- `config.js`: production frontend configuration containing only the public project URL and publishable key.
- `config.example.js`: production configuration template.
- `supabase/schema.sql`: tables, validation, five-per-level cap, grants and RLS.
- `supabase/onboard.example.sql`: template for linking invited accounts, families and learners.
- `supabase/retention-cron.sql`: optional 90-day scheduled purge.
- `docs/`: short operating, privacy and consent records for this pilot.

## 1. Supabase installation

The dedicated EU-region project was installed on 20 October 2026. These are the repeatable installation steps for recovery or a replacement project:

1. Create a new project and select an EU region near Spain.
2. In **SQL Editor**, run `supabase/schema.sql` in full.
3. Confirm the final result lists all eleven pilot tables with `relrowsecurity = true`.
4. Enable Supabase Cron, then run `supabase/retention-cron.sql`. If Cron is unavailable, run `select public.purge_old_diary_entries();` monthly from SQL Editor until it is enabled.
5. In **Authentication → URL Configuration**, set the Site URL to the final GitHub Pages URL and add the exact same URL to Redirect URLs.
6. Keep email authentication enabled and turn **Allow new users to sign up** off after the invited users have been created. The app also passes `shouldCreateUser: false`, so unknown addresses cannot create accounts from its login screen.
7. Configure **Authentication → Emails → SMTP Settings** before inviting external families. Supabase's default sender is currently limited to two messages per hour and project-team addresses; see [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
8. Leave the default session settings for this pilot. The browser stores and refreshes the session, so a family normally uses its email link once on that device and remains signed in until sign-out, browser storage removal or another session-ending event.

## 2. Invite and onboard the pilot

1. Ask each participating adult for the email address they want to use.
2. Invite that exact email in **Authentication → Users**. The family then types the same email into the app whenever they need a sign-in link; they cannot create an unapproved account.
3. Make a local copy of `supabase/onboard.example.sql` named `supabase/onboard.local.sql`.
4. Replace example emails, family aliases, learner aliases and UUIDs. Repeat the family block as needed.
5. Run the local copy in SQL Editor. It is ignored by Git and must never be committed.
6. Run the capacity query at its end. Each level must show `5` or fewer.

Use a short alias or first name only for a learner. Do not enter birth dates, addresses, health information or free-text religious judgments.

## 3. Configure the frontend

Copy the values from `config.example.js` into `config.js`:

- `mode`: `supabase`
- `supabaseUrl`: Project URL
- `supabaseAnonKey`: publishable/anon key
- `responsibleName`: the natural person responsible for the pilot
- `privacyContact`: email for access, correction, export and deletion requests

The publishable/anon key is designed to appear in a public frontend; protection comes from RLS. Never put a `service_role`, secret key or database password in this repository.

## 4. Pre-launch test

Complete `docs/LAUNCH-CHECKLIST.md` with one parent test account and the teacher test account. In particular, verify:

- a parent cannot see another family;
- a teacher cannot edit learner answers;
- a teacher sees the learner's actual submitted answer;
- an unshared family note is absent from the teacher account;
- a shared note appears, and disappears after the parent unshares it;
- a teacher's private muhasabah is absent from the parent account;
- a separately published teacher message appears to an assigned parent and disappears after unpublishing;
- a sixth active learner in a level is rejected by the database.

## 5. GitHub Pages deployment

1. Create a repository and commit the contents of this folder at its root.
2. Push to `main`.
3. Open **Settings → Pages** and publish from the `main` branch, root folder.
4. Open the final HTTPS URL and repeat the parent/teacher smoke test.
5. Only then send individual invitations to pilot families.

Repository: `https://github.com/MohammedAlMamun/muslimer-pathshala-diary`

Live site: `https://mohammedalmamun.github.io/muslimer-pathshala-diary/`

GitHub Pages is a public website even when sign-in protects the data. Do not commit participant identities, filled consent forms, diary exports, service keys, or `onboard.local.sql`.

## Local preview

For visual QA only, temporarily set `mode: 'demo'` in a disposable copy of `config.js`, then serve the folder with a local static server. Do not publish demo mode and do not enter real information in it.

## Operational rule

Pause data entry and contact families if access appears incorrect, an account is compromised, or data is exposed to the wrong person. See `docs/RISK-CHECKLIST.md`.
