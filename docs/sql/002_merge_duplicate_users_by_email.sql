-- Replace this value before running.
-- This script keeps one canonical user for the email and moves auth/core data to it.
-- Run it only for emails you already verified as duplicates from Apple/Google login.

begin;

with input as (
  select lower('usuario@email.com') as email
), ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  inner join input on lower(users.email) = input.email
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
), active_claims as (
  select
    claims.id,
    row_number() over (
      order by claims.claimed_at desc, claims.created_at desc, claims.id desc
    ) as position
  from nfc_tag_claims claims
  where claims.status = 'active'
    and claims.user_id in (select id from ranked_users)
)
update nfc_tag_claims claims
set
  status = 'revoked',
  updated_at = now()
from active_claims
where claims.id = active_claims.id
  and active_claims.position > 1;

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
)
update auth_identities
set
  user_id = (select id from canonical_user),
  updated_at = now()
where user_id in (select id from duplicate_users);

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
)
update refresh_sessions
set
  revoked_at = coalesce(revoked_at, now()),
  updated_at = now()
where user_id in (select id from duplicate_users);

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
)
update rituals
set
  user_id = (select id from canonical_user),
  updated_at = now()
where user_id in (select id from duplicate_users);

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
)
update ritual_sessions
set
  user_id = (select id from canonical_user),
  updated_at = now()
where user_id in (select id from duplicate_users);

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), canonical_user as (
  select id from ranked_users where position = 1
), duplicate_users as (
  select id from ranked_users where position > 1
)
update nfc_tag_claims
set
  user_id = (select id from canonical_user),
  updated_at = now()
where user_id in (select id from duplicate_users);

with ranked_users as (
  select
    users.id,
    row_number() over (
      order by users.email_verified desc, users.created_at asc, users.id asc
    ) as position
  from users
  where lower(users.email) = lower('usuario@email.com')
), duplicate_users as (
  select id from ranked_users where position > 1
)
update users
set
  email = null,
  status = 'disabled',
  updated_at = now()
where id in (select id from duplicate_users);

commit;
