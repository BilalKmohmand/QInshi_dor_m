import { Expense, Payment, Roommate, KittyDeposit, BalanceStat, SettlementTransfer } from '../types';

export const INITIAL_ROOMMATES: Roommate[] = [
  { id: 'u', name: 'Umair', color: '#0B7A6E', handle: 'Alipay / Cash' },
  { id: 'a', name: 'Ali', color: '#2563EB', handle: 'WeChat Pay' },
  { id: 'l', name: 'Aleem', color: '#7C3AED', handle: 'Bank Transfer' },
  { id: 'f', name: 'Faiz', color: '#D97706', handle: 'Cash' },
  { id: 'y', name: 'Yousaf', color: '#DC2626', handle: 'Alipay' },
];

export const INITIAL_CATEGORIES = [
  'Food',
  'Utilities',
  'Supplies',
  'Internet',
  'Snacks',
  'Other',
];

export const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: '2026-10-03',
    what: 'Group dinner',
    cat: 'Food',
    amount: 150,
    paidBy: 'u',
    split: ['u', 'a', 'l'],
    splitMode: 'equal',
    notes: 'Campus cafeteria dinner for 3',
    sample: true,
  },
  {
    id: 'exp-2',
    date: '2026-10-08',
    what: 'Drinking water bottles (x4 18L)',
    cat: 'Utilities',
    amount: 60,
    paidBy: 'a',
    split: ['u', 'a', 'l', 'f', 'y'],
    splitMode: 'equal',
    notes: 'Delivered to room door',
    sample: true,
  },
  {
    id: 'exp-3',
    date: '2026-10-15',
    what: 'Tissues and cleaning supplies',
    cat: 'Supplies',
    amount: 45,
    paidBy: 'f',
    split: ['u', 'a', 'l', 'f', 'y'],
    splitMode: 'equal',
    notes: 'Floor cleaner, garbage bags & wipes',
    sample: true,
  },
];

export const INITIAL_EXPENSES: Expense[] = [];

export const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    date: '2026-10-20',
    from: 'l',
    to: 'u',
    amount: 30,
    note: 'Partial settlement for dinner',
    sample: true,
  },
];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_KITTY_DEPOSITS: KittyDeposit[] = [];


export function monthOf(dateStr: string): string {
  return dateStr ? dateStr.slice(0, 7) : '';
}

export function formatMonthLabel(m: string): string {
  if (!m || m === 'all') return 'All Months';
  const parts = m.split('-');
  if (parts.length < 2) return m;
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function formatMoney(amount: number, symbol = '¥'): string {
  const abs = Math.abs(amount).toFixed(2);
  return `${symbol}${abs}`;
}

export function formatSignedMoney(amount: number, symbol = '¥'): string {
  if (Math.abs(amount) < 0.005) {
    return `${symbol}0.00`;
  }
  const prefix = amount > 0 ? '+' : '−';
  return `${prefix}${symbol}${Math.abs(amount).toFixed(2)}`;
}

/**
 * Calculate per-expense split allocation for a given expense
 */
export function calculateExpenseShare(expense: Expense): Record<string, number> {
  const shares: Record<string, number> = {};
  if (!expense.split || expense.split.length === 0) return shares;

  if (expense.splitMode === 'exact' && expense.customAmounts) {
    expense.split.forEach((id) => {
      shares[id] = expense.customAmounts?.[id] || 0;
    });
    return shares;
  }

  if (expense.splitMode === 'shares' && expense.customShares) {
    let totalShares = 0;
    expense.split.forEach((id) => {
      totalShares += expense.customShares?.[id] || 1;
    });
    if (totalShares > 0) {
      expense.split.forEach((id) => {
        const weight = (expense.customShares?.[id] || 1) / totalShares;
        shares[id] = expense.amount * weight;
      });
      return shares;
    }
  }

  // Default equal split
  const perPerson = expense.amount / expense.split.length;
  expense.split.forEach((id) => {
    shares[id] = perPerson;
  });

  return shares;
}

/**
 * Calculate monthly statistics
 */
export function calculateMonthlyStats(
  expenses: Expense[],
  roommates: Roommate[],
  month: string
): BalanceStat {
  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  const net: Record<string, number> = {};

  roommates.forEach((r) => {
    paid[r.id] = 0;
    share[r.id] = 0;
    net[r.id] = 0;
  });

  expenses.forEach((e) => {
    if (month !== 'all' && monthOf(e.date) !== month) return;

    // If paid by a roommate (not from kitty)
    if (e.paidBy && e.paidBy !== 'KITTY') {
      paid[e.paidBy] = (paid[e.paidBy] || 0) + e.amount;
    }

    const expShare = calculateExpenseShare(e);
    Object.entries(expShare).forEach(([roommateId, amount]) => {
      share[roommateId] = (share[roommateId] || 0) + amount;
    });
  });

  roommates.forEach((r) => {
    net[r.id] = (paid[r.id] || 0) - (share[r.id] || 0);
  });

  return { paid, share, net };
}

/**
 * Calculate running outstanding balances across all time including all payments
 */
export function calculateOutstandingBalances(
  expenses: Expense[],
  payments: Payment[],
  roommates: Roommate[]
): Record<string, number> {
  const allStats = calculateMonthlyStats(expenses, roommates, 'all');
  const balances: Record<string, number> = {};

  roommates.forEach((r) => {
    balances[r.id] = allStats.net[r.id] || 0;
  });

  payments.forEach((p) => {
    // 'from' gave money, so their debt decreases (balance becomes more positive)
    if (balances[p.from] !== undefined) {
      balances[p.from] += p.amount;
    }
    // 'to' received money, so their credit decreases (balance becomes more negative)
    if (balances[p.to] !== undefined) {
      balances[p.to] -= p.amount;
    }
  });

  return balances;
}

/**
 * Calculate kitty total and kitty spent
 */
export function calculateKittySummary(
  deposits: KittyDeposit[],
  expenses: Expense[]
) {
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalSpent = expenses
    .filter((e) => e.paidBy === 'KITTY')
    .reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalDeposited - totalSpent;

  return { totalDeposited, totalSpent, remaining };
}

/**
 * Settlement Algorithm: Option A (Through Room Coordinator)
 */
export function calculateOptionASettlements(
  outstanding: Record<string, number>,
  coordinatorId: string
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = [];

  Object.entries(outstanding).forEach(([id, bal]) => {
    if (id === coordinatorId) return;
    const rounded = Math.round(bal * 100) / 100;
    if (rounded < -0.01) {
      // Debtor pays coordinator
      transfers.push({
        from: id,
        to: coordinatorId,
        amount: Math.abs(rounded),
      });
    } else if (rounded > 0.01) {
      // Coordinator pays creditor
      transfers.push({
        from: coordinatorId,
        to: id,
        amount: rounded,
      });
    }
  });

  return transfers;
}

/**
 * Settlement Algorithm: Option B (Person-to-Person Greedy Simplification)
 */
export function calculateOptionBSettlements(
  outstanding: Record<string, number>
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = [];

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(outstanding).forEach(([id, bal]) => {
    const rounded = Math.round(bal * 100);
    if (rounded < -1) {
      debtors.push({ id, amount: -rounded });
    } else if (rounded > 1) {
      creditors.push({ id, amount: rounded });
    }
  });

  // Sort descending by magnitude
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i].amount;
    const credit = creditors[j].amount;
    const payment = Math.min(debt, credit);

    if (payment > 0) {
      transfers.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: payment / 100,
      });
    }

    debtors[i].amount -= payment;
    creditors[j].amount -= payment;

    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return transfers;
}

/**
 * Generate formatted text for WhatsApp/WeChat group chat
 */
export function generateGroupSummaryText(
  roomName: string,
  roommates: Roommate[],
  outstanding: Record<string, number>,
  settlementsOptionB: SettlementTransfer[],
  currencySymbol: string
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const nameMap = new Map(roommates.map((r) => [r.id, r.name]));

  let text = `🏠 *${roomName} — Expense & Settlement Summary* (${dateStr})\n\n`;
  text += `📊 *Current Balances:*\n`;

  roommates.forEach((r) => {
    const bal = outstanding[r.id] || 0;
    const sign = bal > 0.005 ? '🟢 Group owes' : bal < -0.005 ? '🔴 Owes group' : '⚪ Settled';
    text += `• ${r.name}: ${formatSignedMoney(bal, currencySymbol)} (${sign})\n`;
  });

  text += `\n🤝 *Suggested Settlements (Fewest Transfers):*\n`;
  if (settlementsOptionB.length === 0) {
    text += `✨ All roommates are completely settled up! Zero balance.\n`;
  } else {
    settlementsOptionB.forEach((s, idx) => {
      const fromName = nameMap.get(s.from) || s.from;
      const toName = nameMap.get(s.to) || s.to;
      text += `${idx + 1}. *${fromName}* ➡️ pay *${toName}*: ${formatMoney(s.amount, currencySymbol)}\n`;
    });
  }

  text += `\n_Please confirm in group chat once transfers are sent._`;
  return text;
}

/**
 * Generate CSV export data
 */
export function generateCsvExport(
  expenses: Expense[],
  payments: Payment[],
  roommates: Roommate[]
): string {
  const nameMap = new Map(roommates.map((r) => [r.id, r.name]));

  let csv = 'EXPENSES\n';
  csv += 'ID,Date,What,Category,Amount,Paid By,Split Mode,Split Members,Notes\n';

  expenses.forEach((e) => {
    const payerName = e.paidBy === 'KITTY' ? 'Room Kitty' : nameMap.get(e.paidBy) || e.paidBy;
    const splitNames = e.split.map((id) => nameMap.get(id) || id).join('; ');
    csv += `"${e.id}","${e.date}","${e.what.replace(/"/g, '""')}","${e.cat}",${e.amount},"${payerName}","${e.splitMode}","${splitNames}","${(e.notes || '').replace(/"/g, '""')}"\n`;
  });

  csv += '\nPAYMENTS / REPAYMENTS\n';
  csv += 'ID,Date,From,To,Amount,Notes\n';
  payments.forEach((p) => {
    const fromName = nameMap.get(p.from) || p.from;
    const toName = nameMap.get(p.to) || p.to;
    csv += `"${p.id}","${p.date}","${fromName}","${toName}",${p.amount},"${(p.note || '').replace(/"/g, '""')}"\n`;
  });

  return csv;
}
