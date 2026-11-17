-- Prevent wiping expense_splits / payments when a roommate row is deleted.
-- Run once in Supabase SQL Editor.

alter table expense_splits
  drop constraint if exists expense_splits_roommate_id_fkey,
  add constraint expense_splits_roommate_id_fkey
    foreign key (roommate_id) references roommates(id) on delete restrict;

alter table payments
  drop constraint if exists payments_from_roommate_fkey,
  add constraint payments_from_roommate_fkey
    foreign key (from_roommate) references roommates(id) on delete restrict;

alter table payments
  drop constraint if exists payments_to_roommate_fkey,
  add constraint payments_to_roommate_fkey
    foreign key (to_roommate) references roommates(id) on delete restrict;

alter table kitty_deposits
  drop constraint if exists kitty_deposits_roommate_id_fkey,
  add constraint kitty_deposits_roommate_id_fkey
    foreign key (roommate_id) references roommates(id) on delete restrict;
