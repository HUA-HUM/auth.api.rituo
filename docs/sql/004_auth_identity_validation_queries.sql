-- Use these queries after a clean Apple/Google/NFC test.
-- Expected result for the same email:
-- - one row in users
-- - two rows in auth_identities: apple and google, both with the same user_id
-- - at most one active NFC tag claim for that user

select
  id,
  email,
  display_name,
  email_verified,
  status,
  created_at,
  updated_at
from users
order by created_at desc;

select
  user_id,
  provider,
  provider_email,
  provider_email_verified,
  provider_subject,
  created_at
from auth_identities
order by created_at desc;

select
  user_id,
  count(*) filter (where status = 'active') as active_tag_claims,
  count(*) as total_tag_claims
from nfc_tag_claims
group by user_id
order by user_id;

select
  claims.id,
  claims.user_id,
  claims.tag_id,
  claims.label,
  claims.status,
  claims.claimed_at,
  claims.last_used_at,
  tags.public_code,
  tags.status as tag_status
from nfc_tag_claims claims
inner join nfc_tags tags on tags.id = claims.tag_id
order by claims.created_at desc;
