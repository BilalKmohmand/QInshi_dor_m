import {
  Expense,
  KittyDeposit,
  Payment,
  Roommate,
  RoomSettings,
  SplitMode,
} from '../types';
import { DEFAULT_ROOM_ID, supabase } from './supabase';

type DbRoom = {
  id: string;
  room_name: string;
  room_number: string;
  currency: string;
  currency_symbol: string;
  monthly_budget: number;
  default_coordinator: string | null;
};

type DbRoommate = {
  id: string;
  room_id: string;
  name: string;
  color: string;
  handle: string | null;
};

type DbCategory = {
  id: string;
  room_id: string;
  name: string;
};

type DbExpense = {
  id: string;
  room_id: string;
  date: string;
  what: string;
  category: string;
  amount: number;
  paid_by: string | null;
  paid_from_kitty: boolean;
  split_mode: SplitMode;
  notes: string | null;
  is_sample: boolean;
};

type DbExpenseSplit = {
  expense_id: string;
  roommate_id: string;
  custom_amount: number | null;
  custom_shares: number | null;
};

type DbPayment = {
  id: string;
  room_id: string;
  date: string;
  from_roommate: string;
  to_roommate: string;
  amount: number;
  note: string | null;
  is_sample: boolean;
};

type DbKittyDeposit = {
  id: string;
  room_id: string;
  date: string;
  roommate_id: string;
  amount: number;
  note: string | null;
};

export type RoomSnapshot = {
  roomId: string;
  settings: RoomSettings;
  roommates: Roommate[];
  categories: string[];
  expenses: Expense[];
  payments: Payment[];
  kittyDeposits: KittyDeposit[];
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapRoommate(row: DbRoommate): Roommate {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    handle: row.handle || undefined,
  };
}

function mapExpense(row: DbExpense, splits: DbExpenseSplit[]): Expense {
  const mine = splits.filter((s) => s.expense_id === row.id);
  const split = mine.map((s) => s.roommate_id);
  const customAmounts: Record<string, number> = {};
  const customShares: Record<string, number> = {};

  mine.forEach((s) => {
    if (s.custom_amount != null) customAmounts[s.roommate_id] = Number(s.custom_amount);
    if (s.custom_shares != null) customShares[s.roommate_id] = Number(s.custom_shares);
  });

  return {
    id: row.id,
    date: row.date,
    what: row.what,
    cat: row.category,
    amount: Number(row.amount),
    paidBy: row.paid_from_kitty ? 'KITTY' : (row.paid_by as string),
    split,
    splitMode: row.split_mode,
    customAmounts:
      row.split_mode === 'exact' && Object.keys(customAmounts).length
        ? customAmounts
        : undefined,
    customShares:
      row.split_mode === 'shares' && Object.keys(customShares).length
        ? customShares
        : undefined,
    notes: row.notes || undefined,
    sample: row.is_sample,
  };
}

function mapPayment(row: DbPayment): Payment {
  return {
    id: row.id,
    date: row.date,
    from: row.from_roommate,
    to: row.to_roommate,
    amount: Number(row.amount),
    note: row.note || undefined,
    sample: row.is_sample,
  };
}

function mapKitty(row: DbKittyDeposit): KittyDeposit {
  return {
    id: row.id,
    date: row.date,
    roommateId: row.roommate_id,
    amount: Number(row.amount),
    note: row.note || undefined,
  };
}

export async function loadRoomSnapshot(): Promise<RoomSnapshot> {
  let room: DbRoom | null = null;

  const byId = await supabase.from('rooms').select('*').eq('id', DEFAULT_ROOM_ID).maybeSingle();
  throwIfError(byId.error);
  room = byId.data as DbRoom | null;

  if (!room) {
    const first = await supabase.from('rooms').select('*').order('created_at').limit(1).maybeSingle();
    throwIfError(first.error);
    room = first.data as DbRoom | null;
  }

  if (!room) {
    throw new Error(
      'No room found in Supabase. Run the schema SQL (including the seed insert) first.'
    );
  }

  const roomId = room.id;

  const [roommatesRes, categoriesRes, expensesRes, paymentsRes, kittyRes] = await Promise.all([
    supabase.from('roommates').select('*').eq('room_id', roomId).order('created_at'),
    supabase.from('categories').select('*').eq('room_id', roomId).order('name'),
    supabase.from('expenses').select('*').eq('room_id', roomId).order('date', { ascending: false }),
    supabase.from('payments').select('*').eq('room_id', roomId).order('date', { ascending: false }),
    supabase
      .from('kitty_deposits')
      .select('*')
      .eq('room_id', roomId)
      .order('date', { ascending: false }),
  ]);

  throwIfError(roommatesRes.error);
  throwIfError(categoriesRes.error);
  throwIfError(expensesRes.error);
  throwIfError(paymentsRes.error);
  throwIfError(kittyRes.error);

  const expenseRows = (expensesRes.data || []) as DbExpense[];
  const expenseIds = expenseRows.map((e) => e.id);
  let splits: DbExpenseSplit[] = [];
  if (expenseIds.length) {
    const splitsRes = await supabase.from('expense_splits').select('*').in('expense_id', expenseIds);
    throwIfError(splitsRes.error);
    splits = (splitsRes.data || []) as DbExpenseSplit[];
  }

  const roommates = ((roommatesRes.data || []) as DbRoommate[]).map(mapRoommate);
  const categories = ((categoriesRes.data || []) as DbCategory[]).map((c) => c.name);
  const expenses = expenseRows.map((e) => mapExpense(e, splits)).filter((e) => !e.sample);
  const payments = ((paymentsRes.data || []) as DbPayment[])
    .map(mapPayment)
    .filter((p) => !p.sample);
  const kittyDeposits = ((kittyRes.data || []) as DbKittyDeposit[]).map(mapKitty);

  const settings: RoomSettings = {
    roomName: room.room_name,
    roomNumber: room.room_number,
    currency: room.currency,
    currencySymbol: room.currency_symbol,
    monthlyBudget: Number(room.monthly_budget),
    defaultCoordinator: room.default_coordinator || roommates[0]?.id || '',
  };

  return { roomId, settings, roommates, categories, expenses, payments, kittyDeposits };
}

export async function updateRoomSettings(roomId: string, settings: RoomSettings) {
  const { error } = await supabase
    .from('rooms')
    .update({
      room_name: settings.roomName,
      room_number: settings.roomNumber,
      currency: settings.currency,
      currency_symbol: settings.currencySymbol,
      monthly_budget: settings.monthlyBudget,
      default_coordinator: settings.defaultCoordinator || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);
  throwIfError(error);
}

export async function syncRoommates(roomId: string, roommates: Roommate[]) {
  const { data: existing, error: loadErr } = await supabase
    .from('roommates')
    .select('id')
    .eq('room_id', roomId);
  throwIfError(loadErr);

  const existingIds = new Set((existing || []).map((r: { id: string }) => r.id));
  const nextIds = new Set(roommates.map((r) => r.id));

  const toDelete = [...existingIds].filter((id) => !nextIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from('roommates').delete().in('id', toDelete);
    throwIfError(error);
  }

  for (const r of roommates) {
    const payload = {
      id: r.id,
      room_id: roomId,
      name: r.name,
      color: r.color,
      handle: r.handle || null,
    };
    const { error } = await supabase.from('roommates').upsert(payload);
    throwIfError(error);
  }
}

export async function syncCategories(roomId: string, categories: string[]) {
  const { error: delErr } = await supabase.from('categories').delete().eq('room_id', roomId);
  throwIfError(delErr);

  if (!categories.length) return;

  const { error } = await supabase.from('categories').insert(
    categories.map((name) => ({ room_id: roomId, name }))
  );
  throwIfError(error);
}

async function replaceExpenseSplits(expense: Expense) {
  const { error: delErr } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expense.id);
  throwIfError(delErr);

  if (!expense.split.length) return;

  const rows = expense.split.map((roommateId) => ({
    expense_id: expense.id,
    roommate_id: roommateId,
    custom_amount:
      expense.splitMode === 'exact' ? expense.customAmounts?.[roommateId] ?? null : null,
    custom_shares:
      expense.splitMode === 'shares' ? expense.customShares?.[roommateId] ?? 1 : 1,
  }));

  const { error } = await supabase.from('expense_splits').insert(rows);
  throwIfError(error);
}

function expenseRow(roomId: string, expense: Expense) {
  const fromKitty = expense.paidBy === 'KITTY';
  return {
    id: expense.id,
    room_id: roomId,
    date: expense.date,
    what: expense.what,
    category: expense.cat,
    amount: expense.amount,
    paid_by: fromKitty ? null : expense.paidBy,
    paid_from_kitty: fromKitty,
    split_mode: expense.splitMode,
    notes: expense.notes || null,
    is_sample: !!expense.sample,
  };
}

export async function upsertExpense(roomId: string, expense: Expense) {
  const { error } = await supabase.from('expenses').upsert(expenseRow(roomId, expense));
  throwIfError(error);
  await replaceExpenseSplits(expense);
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  throwIfError(error);
}

export async function insertPayment(roomId: string, payment: Payment) {
  const { error } = await supabase.from('payments').insert({
    id: payment.id,
    room_id: roomId,
    date: payment.date,
    from_roommate: payment.from,
    to_roommate: payment.to,
    amount: payment.amount,
    note: payment.note || null,
    is_sample: !!payment.sample,
  });
  throwIfError(error);
}

export async function deletePayment(id: string) {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  throwIfError(error);
}

export async function insertKittyDeposit(roomId: string, deposit: KittyDeposit) {
  const { error } = await supabase.from('kitty_deposits').insert({
    id: deposit.id,
    room_id: roomId,
    date: deposit.date,
    roommate_id: deposit.roommateId,
    amount: deposit.amount,
    note: deposit.note || null,
  });
  throwIfError(error);
}

export async function deleteKittyDeposit(id: string) {
  const { error } = await supabase.from('kitty_deposits').delete().eq('id', id);
  throwIfError(error);
}

export async function clearTransactions(roomId: string) {
  const [e, p, k] = await Promise.all([
    supabase.from('expenses').delete().eq('room_id', roomId),
    supabase.from('payments').delete().eq('room_id', roomId),
    supabase.from('kitty_deposits').delete().eq('room_id', roomId),
  ]);
  throwIfError(e.error);
  throwIfError(p.error);
  throwIfError(k.error);
}

export async function deleteSampleRows(roomId: string) {
  const [e, p] = await Promise.all([
    supabase.from('expenses').delete().eq('room_id', roomId).eq('is_sample', true),
    supabase.from('payments').delete().eq('room_id', roomId).eq('is_sample', true),
  ]);
  throwIfError(e.error);
  throwIfError(p.error);
}

/** Replace all ledger data for a room (used by import / sample restore). */
export async function replaceRoomLedger(
  roomId: string,
  data: {
    settings: RoomSettings;
    roommates: Roommate[];
    categories: string[];
    expenses: Expense[];
    payments: Payment[];
    kittyDeposits: KittyDeposit[];
  }
) {
  await clearTransactions(roomId);
  await syncRoommates(roomId, data.roommates);
  await syncCategories(roomId, data.categories);
  await updateRoomSettings(roomId, data.settings);

  for (const expense of data.expenses) {
    await upsertExpense(roomId, { ...expense, sample: false });
  }
  for (const payment of data.payments) {
    await insertPayment(roomId, { ...payment, sample: false });
  }
  for (const deposit of data.kittyDeposits) {
    await insertKittyDeposit(roomId, deposit);
  }
}

export function newId(): string {
  return crypto.randomUUID();
}
