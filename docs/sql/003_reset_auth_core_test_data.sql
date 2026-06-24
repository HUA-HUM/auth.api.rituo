-- WARNING: this deletes all test users, identities, sessions, rituals and NFC tags.
-- Use only in a development/test database when you want a clean Apple/Google/NFC run.

begin;

truncate table
  refresh_sessions,
  auth_identities,
  ritual_sessions,
  ritual_blocked_items,
  rituals,
  nfc_tag_claims,
  nfc_tags,
  users
restart identity cascade;

commit;
