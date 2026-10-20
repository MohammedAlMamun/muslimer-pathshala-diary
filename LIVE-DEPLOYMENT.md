# Live deployment

- Repository: https://github.com/MohammedAlMamun/muslimer-pathshala-diary
- Website: https://mohammedalmamun.github.io/muslimer-pathshala-diary/
- Supabase project: `jopzzzylwmxzhrawumrr` (EU West / Ireland)
- Data boundary: three levels, at most five active learners per level
- Retention: automatic 90-day purge scheduled nightly at 03:17 UTC
- Access: invited email accounts only; no open sign-up

## Operational status

The database schema, capacity controls, grants, row-level security and retention job are installed. GitHub Pages is live over HTTPS, and the pre-sign-in page, assets and browser console passed verification. Mohammed Al Mamun is recorded as the responsible person. The teacher account `muslimerpathshala@gmail.com` has been invited and linked to an active teacher profile. Before admitting each family, invite the parent's chosen email, run a private filled copy of `supabase/onboard.example.sql`, and complete the two-account smoke test in `docs/LAUNCH-CHECKLIST.md`.
