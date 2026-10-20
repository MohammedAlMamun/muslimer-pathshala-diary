# Live deployment

- Repository: https://github.com/MohammedAlMamun/muslimer-pathshala-diary
- Website: https://mohammedalmamun.github.io/muslimer-pathshala-diary/
- Supabase project: `jopzzzylwmxzhrawumrr` (EU West / Ireland)
- Data boundary: three levels, at most five active learners per level
- Retention: automatic 90-day purge scheduled nightly at 03:17 UTC
- Access: invited email accounts only; no open sign-up

## Operational status

The database schema, capacity controls, grants, row-level security and retention job are installed. Before sending invitations to families, fill the responsible person's confirmed full name in the Spanish privacy documents, invite the teacher and parents, run a private filled copy of `supabase/onboard.example.sql`, and complete the two-account smoke test in `docs/LAUNCH-CHECKLIST.md`.
