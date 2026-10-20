# Primary pilot launch checklist

Complete every launch-blocking item before inviting families.

## Scope and people

- [ ] Exactly three levels are used.
- [ ] Each level has 0–5 active learners; no more than 15 total.
- [ ] One responsible adult is named in `docs/PRIVACY-NOTICE-ES.md` and `config.js`.
- [ ] One teacher and each parent have separate invited accounts.
- [ ] Learners use aliases/first names only.

## Supabase

- [ ] Project region is in the EU.
- [ ] `supabase/schema.sql` completed without an error.
- [ ] All nine tables report `relrowsecurity = true`.
- [ ] Site URL and redirect URL exactly match the final HTTPS GitHub Pages URL.
- [ ] Only the publishable/anon key is in `config.js`; no service key is in Git.
- [ ] The 90-day Cron job is active, or a monthly manual purge date is scheduled.

## Access test with two real test accounts

- [ ] Parent sees only their family and learners.
- [ ] Parent can submit and reload an answer.
- [ ] Teacher sees the learner's submitted answer but cannot change it.
- [ ] Teacher cannot see the parent's family diary answers.
- [ ] Teacher cannot see an unshared note.
- [ ] Teacher sees a shared note; after unsharing, the note disappears.
- [ ] Unknown email cannot create an account.
- [ ] Disabled account cannot load diary data.
- [ ] Database rejects a sixth active learner in any level.

## Family readiness

- [ ] Privacy notice is completed and sent before access.
- [ ] Parent has given explicit, recorded consent in the app.
- [ ] Parent knows how to request access, correction, export or deletion.
- [ ] Parent understands this is reflection, not scoring or religious judgment.
- [ ] Child has received an age-appropriate explanation and can decline an answer.

## Go / no-go

- [ ] Mobile test passes on the phone families will use.
- [ ] No console errors or failed Supabase requests appear in the smoke test.
- [ ] A backup administrator can disable an account if the primary operator is unavailable.
- [ ] Incident contact method is written down.
- [ ] **GO approved only after every item above is checked.**
