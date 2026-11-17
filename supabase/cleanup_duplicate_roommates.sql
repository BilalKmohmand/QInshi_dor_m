-- Safe cleanup: remove DUPLICATE roommate rows that are NOT used by any expense/payment/kitty.
-- Does NOT touch seed IDs that appear on existing expenses (1111…, 2222…, etc.).
-- Run in Supabase SQL Editor after reviewing the SELECT below.

-- Preview unused duplicates first:
-- select id, name from roommates r
-- where room_id = '00000000-0000-0000-0000-000000000001'
--   and not exists (select 1 from expenses e where e.paid_by = r.id)
--   and not exists (select 1 from expense_splits s where s.roommate_id = r.id)
--   and not exists (select 1 from payments p where p.from_roommate = r.id or p.to_roommate = r.id)
--   and not exists (select 1 from kitty_deposits k where k.roommate_id = r.id);

delete from roommates r
where r.room_id = '00000000-0000-0000-0000-000000000001'
  and not exists (select 1 from expenses e where e.paid_by = r.id)
  and not exists (select 1 from expense_splits s where s.roommate_id = r.id)
  and not exists (select 1 from payments p where p.from_roommate = r.id or p.to_roommate = r.id)
  and not exists (select 1 from kitty_deposits k where k.roommate_id = r.id)
  and r.id not in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '59087cf0-b2b8-451e-a8b9-718d31194e9b',
    'f185e498-07cb-4a53-9701-7783bd3afefa',
    '6306c578-32a1-45d6-b507-b653b8a04ed1',
    'c4b5691b-2d80-4b2f-90b5-de9a179c3737'
  );
