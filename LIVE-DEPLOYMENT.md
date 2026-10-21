# Live deployment

- Repository: https://github.com/MohammedAlMamun/muslimer-pathshala-diary
- Website: https://mohammedalmamun.github.io/muslimer-pathshala-diary/
- Supabase project: `jopzzzylwmxzhrawumrr` (EU West / Ireland)
- Data boundary: three levels, at most five active learners per level
- Retention: automatic 90-day purge scheduled nightly at 03:17 UTC
- Access: the app is invitation-only; the Supabase public-signup toggle still needs to be disabled before family onboarding
- Teacher monitoring: apply `supabase/hotfix-v03-4-teacher-family-answers.sql` so assigned teachers can read only the guardian's four daily support answers. Private guardian comments remain excluded unless explicitly shared.

## Operational status

The v0.3 database schema, capacity controls, grants, row-level security and retention job are installed. The hosted SQL post-install check returned all eleven expected tables with `relrowsecurity = true` on 21 October 2026. GitHub Pages is live over HTTPS, and the pre-sign-in page, assets and browser console passed verification. Mohammed Al Mamun is recorded as the responsible person. The teacher account `muslimerpathshala@gmail.com` has been invited and linked to an active teacher profile.

Before the v0.3 family pilot, deploy the v0.3 frontend, disable public signup, and configure custom SMTP. The dashboard audit on 21 October 2026 found custom SMTP unset and the Auth email limit at two per hour. Then invite each parent's chosen email, run a private filled copy of `supabase/onboard.example.sql`, and complete the two-account smoke test in `docs/LAUNCH-CHECKLIST.md`.
