-- Run this only after merging any existing duplicate users that share the same email.
-- It prevents future Apple/Google sign-ins from creating multiple users for one email.

create unique index if not exists users_unique_lower_email_idx
  on users (lower(email))
  where email is not null;
