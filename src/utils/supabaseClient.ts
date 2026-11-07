import { createClient } from '@supabase/supabase-js';
import {
  Expense,
  Payment,
  Roommate,
  KittyDeposit,
  RoomSettings,
  PaymentRequest,
  AppNotification,
  AuditLog,
  PaymentRequestStatus,
  NotificationType,
} from '../types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gnrxjzzokgtyxodkxtro.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_LYwPHCKWZdHr5BIXeFV-LA_qbZ2A4js';

export const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'hostel_supabase_auth_session',
  },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
});

export function newId(): string {
  return crypto.randomUUID();
}

interface SupabaseRoomRow {
  id: string;
  room_name: string;
  room_number: string;
  currency: string;
  currency_symbol: string;
  monthly_budget: number;
  default_coordinator: string | null;
}

interface SupabaseRoommateRow {
  id: string;
  room_id: string;
  name: string;
  color: string;
  handle: string | null;
  created_at: string;
}

interface SupabaseExpenseRow {
  id: string;
  room_id: string;
  date: string;
  what: string;
  category: string;
  amount: number;
  paid_by: string | null;
  paid_from_kitty: boolean;
  split_mode: string;
  notes: string | null;
  is_sample: boolean;
  created_at: string;
}

interface SupabaseExpenseSplitRow {
  expense_id: string;
  roommate_id: string;
  custom_amount: number | null;
  custom_shares: number | null;
}

interface SupabasePaymentRow {
  id: string;
  room_id: string;
  date: string;
  from_roommate: string;
  to_roommate: string;
  amount: number;
  note: string | null;
  is_sample: boolean;
  created_at: string;
}

interface SupabaseKittyDepositRow {
  id: string;
  room_id: string;
  date: string;
  roommate_id: string;
  amount: number;
  note: string | null;
  created_at?: string;
}

interface SupabasePaymentRequestRow {
  id: string;
  room_id: string;
  from_roommate: string;
  to_roommate: string;
  amount: number;
  date: string;
  method: string;
  reference: string | null;
  notes: string | null;
  receipt_url: string | null;
  status: PaymentRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface SupabaseNotificationRow {
  id: string;
  room_id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link_tab: string | null;
  related_id: string | null;
  created_at: string;
}

interface SupabaseAuditLogRow {
  id: string;
  room_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: AuditLog['entityType'];
  entity_id: string | null;
  amount: number | null;
  details: string;
  timestamp: string;
}

export async function fetchCompleteRoomData(roomId = DEFAULT_ROOM_ID): Promise<{
  settings: RoomSettings;
  roommates: Roommate[];
  categories: string[];
  expenses: Expense[];
  payments: Payment[];
  kittyDeposits: KittyDeposit[];
  paymentRequests: PaymentRequest[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}> {
  // Core ledger first (fast path), then secondary feature tables.
  const [roomRes, roommatesRes, categoriesRes, expensesRes, paymentsRes, kittyRes] =
    await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
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

  const [requestsRes, notifsRes, auditRes] = await Promise.all([
    supabase
      .from('payment_requests')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('notifications')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: false })
      .limit(100),
  ]);

  if (roomRes.error) throw roomRes.error;
  if (roommatesRes.error) throw roommatesRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (kittyRes.error) throw kittyRes.error;
  // New tables may not exist yet — treat as empty until migration runs
  const paymentRequests: PaymentRequest[] = requestsRes.error
    ? []
    : ((requestsRes.data as SupabasePaymentRequestRow[]) || []).map((r) => ({
        id: r.id,
        fromRoommate: r.from_roommate,
        toRoommate: r.to_roommate,
        amount: Number(r.amount),
        date: r.date,
        method: r.method,
        reference: r.reference || undefined,
        notes: r.notes || undefined,
        receiptUrl: r.receipt_url || undefined,
        status: r.status,
        reviewedBy: r.reviewed_by || undefined,
        reviewedAt: r.reviewed_at || undefined,
        rejectionReason: r.rejection_reason || undefined,
        createdAt: r.created_at,
      }));

  const notifications: AppNotification[] = notifsRes.error
    ? []
    : ((notifsRes.data as SupabaseNotificationRow[]) || []).map((n) => ({
        id: n.id,
        recipientId: n.recipient_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        linkTab: n.link_tab || undefined,
        relatedId: n.related_id || undefined,
        createdAt: n.created_at,
      }));

  const auditLogs: AuditLog[] = auditRes.error
    ? []
    : ((auditRes.data as SupabaseAuditLogRow[]) || []).map((a) => ({
        id: a.id,
        actorId: a.actor_id,
        actorName: a.actor_name,
        action: a.action,
        entityType: a.entity_type,
        entityId: a.entity_id || undefined,
        amount: a.amount == null ? undefined : Number(a.amount),
        details: a.details,
        timestamp: a.timestamp,
      }));

  const roomRow = roomRes.data as SupabaseRoomRow | null;
  const settings: RoomSettings = {
    id: roomId,
    roomName: roomRow?.room_name || 'Hostel Room',
    roomNumber: roomRow?.room_number || '',
    currency: roomRow?.currency || 'CNY',
    currencySymbol: roomRow?.currency_symbol || '¥',
    monthlyBudget: Number(roomRow?.monthly_budget || 0),
    defaultCoordinator: roomRow?.default_coordinator || '',
  };

  const roommates: Roommate[] = ((roommatesRes.data as SupabaseRoommateRow[]) || []).map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color || '#0B7A6E',
    handle: r.handle || undefined,
    isActive: true,
  }));

  if (!settings.defaultCoordinator && roommates.length > 0) {
    const bilal = roommates.find((r) => r.name.toLowerCase().includes('bilal'));
    settings.defaultCoordinator = bilal ? bilal.id : roommates[0].id;
  }

  const categories: string[] = ((categoriesRes.data as { name: string }[]) || []).map((c) => c.name);
  const resolvedCategories =
    categories.length > 0
      ? categories
      : ['Food', 'Utilities', 'Supplies', 'Internet', 'Snacks', 'Other'];

  const rawExpenses = (expensesRes.data as SupabaseExpenseRow[]) || [];
  const expenseIds = rawExpenses.map((e) => e.id);

  let allSplits: SupabaseExpenseSplitRow[] = [];
  if (expenseIds.length > 0) {
    const splitsRes = await supabase.from('expense_splits').select('*').in('expense_id', expenseIds);
    allSplits = (splitsRes.data as SupabaseExpenseSplitRow[]) || [];
  }

  const splitsByExpenseId = new Map<string, SupabaseExpenseSplitRow[]>();
  allSplits.forEach((s) => {
    const existing = splitsByExpenseId.get(s.expense_id) || [];
    existing.push(s);
    splitsByExpenseId.set(s.expense_id, existing);
  });

  const expenses: Expense[] = rawExpenses.map((e) => {
    const splits = splitsByExpenseId.get(e.id) || [];
    const splitMemberIds = splits.map((s) => s.roommate_id);
    const customAmounts: Record<string, number> = {};
    const customShares: Record<string, number> = {};

    splits.forEach((s) => {
      if (s.custom_amount !== null && s.custom_amount !== undefined) {
        customAmounts[s.roommate_id] = Number(s.custom_amount);
      }
      if (s.custom_shares !== null && s.custom_shares !== undefined) {
        customShares[s.roommate_id] = Number(s.custom_shares);
      }
    });

    return {
      id: e.id,
      date: e.date,
      what: e.what,
      cat: e.category,
      amount: Number(e.amount),
      paidBy: e.paid_from_kitty ? 'KITTY' : e.paid_by || '',
      split: splitMemberIds.length > 0 ? splitMemberIds : roommates.map((r) => r.id),
      splitMode: (e.split_mode as 'equal' | 'exact' | 'shares') || 'equal',
      customAmounts: Object.keys(customAmounts).length > 0 ? customAmounts : undefined,
      customShares: Object.keys(customShares).length > 0 ? customShares : undefined,
      notes: e.notes || undefined,
      sample: e.is_sample,
      createdAt: e.created_at,
    };
  });

  const payments: Payment[] = ((paymentsRes.data as SupabasePaymentRow[]) || []).map((p) => ({
    id: p.id,
    date: p.date,
    from: p.from_roommate,
    to: p.to_roommate,
    amount: Number(p.amount),
    note: p.note || undefined,
    sample: p.is_sample,
    createdAt: p.created_at,
  }));

  const kittyDeposits: KittyDeposit[] = ((kittyRes.data as SupabaseKittyDepositRow[]) || []).map(
    (k) => ({
      id: k.id,
      date: k.date,
      roommateId: k.roommate_id,
      amount: Number(k.amount),
      note: k.note || undefined,
      createdAt: k.created_at,
    })
  );

  return {
    settings,
    roommates,
    categories: resolvedCategories,
    expenses,
    payments,
    kittyDeposits,
    paymentRequests,
    notifications,
    auditLogs,
  };
}

export async function saveExpenseToSupabase(roomId: string, expense: Expense): Promise<void> {
  const isKitty = expense.paidBy === 'KITTY';
  const { error: expErr } = await supabase.from('expenses').upsert({
    id: expense.id,
    room_id: roomId,
    date: expense.date,
    what: expense.what,
    category: expense.cat,
    amount: expense.amount,
    paid_by: isKitty ? null : expense.paidBy,
    paid_from_kitty: isKitty,
    split_mode: expense.splitMode,
    notes: expense.notes || null,
    is_sample: !!expense.sample,
  });
  if (expErr) throw expErr;

  await supabase.from('expense_splits').delete().eq('expense_id', expense.id);

  if (expense.split?.length) {
    const { error: splitErr } = await supabase.from('expense_splits').insert(
      expense.split.map((rmId) => ({
        expense_id: expense.id,
        roommate_id: rmId,
        custom_amount:
          expense.splitMode === 'exact' ? expense.customAmounts?.[rmId] ?? null : null,
        custom_shares: expense.splitMode === 'shares' ? expense.customShares?.[rmId] ?? 1 : 1,
      }))
    );
    if (splitErr) throw splitErr;
  }
}

export async function deleteExpenseFromSupabase(expenseId: string): Promise<void> {
  await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function savePaymentToSupabase(roomId: string, payment: Payment): Promise<void> {
  const { error } = await supabase.from('payments').upsert({
    id: payment.id,
    room_id: roomId,
    date: payment.date,
    from_roommate: payment.from,
    to_roommate: payment.to,
    amount: payment.amount,
    note: payment.note || null,
    is_sample: !!payment.sample,
  });
  if (error) throw error;
}

export async function deletePaymentFromSupabase(paymentId: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', paymentId);
  if (error) throw error;
}

export async function saveKittyDepositToSupabase(
  roomId: string,
  deposit: KittyDeposit
): Promise<void> {
  const { error } = await supabase.from('kitty_deposits').upsert({
    id: deposit.id,
    room_id: roomId,
    date: deposit.date,
    roommate_id: deposit.roommateId,
    amount: deposit.amount,
    note: deposit.note || null,
  });
  if (error) throw error;
}

export async function deleteKittyDepositFromSupabase(depositId: string): Promise<void> {
  const { error } = await supabase.from('kitty_deposits').delete().eq('id', depositId);
  if (error) throw error;
}

export async function updateRoomSettingsInSupabase(
  roomId: string,
  settings: RoomSettings
): Promise<void> {
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
  if (error) throw error;
}

export async function updateRoommatesInSupabase(
  roomId: string,
  roommates: Roommate[]
): Promise<void> {
  for (const r of roommates) {
    const { error } = await supabase.from('roommates').upsert({
      id: r.id,
      room_id: roomId,
      name: r.name,
      color: r.color,
      handle: r.handle || null,
    });
    if (error) throw error;
  }
}

export async function savePaymentRequestToSupabase(
  roomId: string,
  request: PaymentRequest
): Promise<void> {
  const { error } = await supabase.from('payment_requests').upsert({
    id: request.id,
    room_id: roomId,
    from_roommate: request.fromRoommate,
    to_roommate: request.toRoommate,
    amount: request.amount,
    date: request.date,
    method: request.method,
    reference: request.reference || null,
    notes: request.notes || null,
    receipt_url: request.receiptUrl || null,
    status: request.status,
    reviewed_by: request.reviewedBy || null,
    reviewed_at: request.reviewedAt || null,
    rejection_reason: request.rejectionReason || null,
    created_at: request.createdAt,
  });
  if (error) throw error;
}

export async function saveNotificationToSupabase(
  roomId: string,
  notification: AppNotification
): Promise<void> {
  const { error } = await supabase.from('notifications').upsert({
    id: notification.id,
    room_id: roomId,
    recipient_id: notification.recipientId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    is_read: notification.isRead,
    link_tab: notification.linkTab || null,
    related_id: notification.relatedId || null,
    created_at: notification.createdAt,
  });
  if (error) throw error;
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function saveAuditLogToSupabase(roomId: string, log: AuditLog): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    id: log.id,
    room_id: roomId,
    actor_id: log.actorId,
    actor_name: log.actorName,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId || null,
    amount: log.amount ?? null,
    details: log.details,
    timestamp: log.timestamp,
  });
  if (error) throw error;
}
