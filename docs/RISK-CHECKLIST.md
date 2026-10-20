# Risk and incident checklist

## Before launch

- Use a dedicated EU-region Supabase project with a strong owner password and MFA.
- Keep participant emails and filled onboarding SQL out of GitHub.
- Use aliases for children and collect no unnecessary free text.
- Test RLS with separate parent and teacher accounts, not only in SQL Editor.
- Confirm the teacher understands read-only, non-scoring use.
- Record who can disable accounts and who covers absence.

## Monthly

- Review active users and remove anyone who left.
- Confirm each level still has at most five active learners.
- Check the retention Cron job and run history.
- Review Supabase security/advisor warnings and failed authentication activity.
- Ask families whether any information is incorrect or no longer needed.

## If something goes wrong

1. Pause invitations and diary entry.
2. Disable the affected profile (`active = false`) and, if necessary, the Supabase Auth user.
3. Preserve a short factual incident log: discovery time, accounts, rows, cause and containment.
4. Determine whether personal data was viewed, changed, lost or disclosed to the wrong person.
5. Notify affected families promptly when there is risk to them.
6. Obtain Spanish privacy advice immediately if the incident may require AEPD notification; GDPR breach deadlines can be short.
7. Fix and retest access with separate accounts before reopening.

Do not copy diary data into WhatsApp groups, shared spreadsheets, screenshots or public issue trackers while resolving an incident.
