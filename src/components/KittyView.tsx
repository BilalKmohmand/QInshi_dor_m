import React, { useState } from 'react';
import { KittyDeposit, Roommate, Expense } from '../types';
import { calculateKittySummary, formatMoney } from '../utils/calculator';
import { Plus, Wallet, AlertTriangle, ArrowDownRight, Trash2 } from 'lucide-react';

interface KittyViewProps {
  deposits: KittyDeposit[];
  expenses: Expense[];
  roommates: Roommate[];
  currencySymbol: string;
  onAddDeposit: (deposit: Omit<KittyDeposit, 'id'>) => void;
  onDeleteDeposit: (id: string) => void;
  onLogKittyExpense: () => void;
}

export const KittyView: React.FC<KittyViewProps> = ({
  deposits,
  expenses,
  roommates,
  currencySymbol,
  onAddDeposit,
  onDeleteDeposit,
  onLogKittyExpense,
}) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roommateId, setRoommateId] = useState(roommates[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));
  const summary = calculateKittySummary(deposits, expenses);
  const kittyExpenses = expenses.filter((e) => e.paidBy === 'KITTY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    onAddDeposit({
      date,
      roommateId,
      amount: parsed,
      note: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
  };

  const isLowBalance = summary.remaining < 30;

  return (
    <div className="space-y-6">
      {/* Intro & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Current Kitty Balance</span>
            <Wallet className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(summary.remaining, currencySymbol)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Available communal fund
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Total Pooled</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(summary.totalDeposited, currencySymbol)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            From {deposits.length} roommate deposits
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Spent from Kitty</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(summary.totalSpent, currencySymbol)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Across {kittyExpenses.length} communal purchases
          </div>
        </div>
      </div>

      {isLowBalance && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            The room kitty balance is low ({formatMoney(summary.remaining, currencySymbol)}). Roommates should contribute their monthly pool deposit!
          </span>
        </div>
      )}

      {/* Deposit Form & Action */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100">
              Contribute to Room Kitty
            </h4>
            <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
              Add cash or funds collected for communal supplies (toilet paper, mop, garbage bags, water gallons)
            </p>
          </div>

          <button
            type="button"
            onClick={onLogKittyExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Spend from Kitty
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Contributor
            </label>
            <select
              value={roommateId}
              onChange={(e) => setRoommateId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
            >
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-neutral-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="20.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors"
            >
              <Plus className="w-4 h-4" /> Deposit to Kitty
            </button>
          </div>
        </form>
      </div>

      {/* Two Column Table: Kitty Deposits vs Kitty Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposits Log */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-3">
            Kitty Deposits ({deposits.length})
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
                  <th className="py-2">Date</th>
                  <th className="py-2">Roommate</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-400">
                      No deposits in the kitty yet.
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 font-mono tabular-nums text-neutral-500">
                        {d.date}
                      </td>
                      <td className="py-2 font-medium text-neutral-800 dark:text-neutral-200">
                        {roommateMap.get(d.roommateId)?.name || d.roommateId}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(d.amount, currencySymbol)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteDeposit(d.id)}
                          className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Paid with Kitty */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-3">
            Purchases Paid from Kitty ({kittyExpenses.length})
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
                  <th className="py-2">Date</th>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
                {kittyExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-400">
                      No purchases charged to the kitty yet.
                    </td>
                  </tr>
                ) : (
                  kittyExpenses.map((ke) => (
                    <tr key={ke.id}>
                      <td className="py-2 font-mono tabular-nums text-neutral-500">
                        {ke.date}
                      </td>
                      <td className="py-2 font-medium text-neutral-800 dark:text-neutral-200">
                        {ke.what}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                        −{formatMoney(ke.amount, currencySymbol)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
