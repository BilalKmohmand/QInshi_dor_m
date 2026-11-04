-- Allow the publishable (anon) key to read/write this public room ledger.
-- Run once in Supabase SQL Editor if inserts/selects fail with RLS errors.

alter table rooms enable row level security;
alter table roommates enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table payments enable row level security;
alter table kitty_deposits enable row level security;

create policy "anon_all_rooms" on rooms for all to anon, authenticated using (true) with check (true);
create policy "anon_all_roommates" on roommates for all to anon, authenticated using (true) with check (true);
create policy "anon_all_categories" on categories for all to anon, authenticated using (true) with check (true);
create policy "anon_all_expenses" on expenses for all to anon, authenticated using (true) with check (true);
create policy "anon_all_expense_splits" on expense_splits for all to anon, authenticated using (true) with check (true);
create policy "anon_all_payments" on payments for all to anon, authenticated using (true) with check (true);
create policy "anon_all_kitty_deposits" on kitty_deposits for all to anon, authenticated using (true) with check (true);
