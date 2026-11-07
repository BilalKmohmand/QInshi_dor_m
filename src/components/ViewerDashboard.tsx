import React, { useState } from 'react';
import { Expense, Payment, Roommate, KittyDeposit, RoomSettings } from '../types';
import {
  calculateMonthlyStats,
  calculateOutstandingBalances,
  calculateOptionBSettlements,
  calculateKittySummary,
  formatMoney,
  formatSignedMoney,
  monthOf,
} from '../utils/calculator';
import {
  TrendingUp,
  Receipt,
  Users,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Search,
  Target,
  ExternalLink,
  Shield,
  Copy,
  Check,
} from 'lucide-react';

interface ViewerDashboardProps {
  expenses: Expense[];
  payments: Payment[];
  roommates: Roommate[];
  categories: string[];
  settings: RoomSettings;
  kittyDeposits: KittyDeposit[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  allMonths: string[];
  onSwitchToEditor: () => void;
}

export const ViewerDashboard: React.FC<ViewerDashboardProps> = ({
  expenses,
  payments,
  roommates,
  categories,
  settings,
  kittyDeposits,
  selectedMonth,
  onSelectMonth,
  allMonths,
  onSwitchToEditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const currencySymbol = settings.currencySymbol;
  const roommateMap = new Map(roommates.map((r) => [r.id, r]));

  // Month stats & balances
  const monthStats = calculateMonthlyStats(expenses, roommates, selectedMonth);
  const outstanding = calculateOutstandingBalances(expenses, payments, roommates);
  const settlements = calculateOptionBSettlements(outstanding);
  const kittySummary = calculateKittySummary(kittyDeposits, expenses);

  // Filtered expenses for the table
  const filteredExpenses = expenses
    .filter((e) => {
      if (selectedMonth !== 'all' && monthOf(e.date) !== selectedMonth) return false;
      if (selectedCat !== 'all' && e.cat !== selectedCat) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesWhat = e.what.toLowerCase().includes(q);
        const matchesPayer = (roommateMap.get(e.paidBy)?.name || '').toLowerCase().includes(q);
        if (!matchesWhat && !matchesPayer) return false;
      }
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgPerPerson = roommates.length > 0 ? totalSpent / roommates.length : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  categories.forEach((c) => (categoryTotals[c] = 0));
  filteredExpenses.forEach((e) => {
    categoryTotals[e.cat] = (categoryTotals[e.cat] || 0) + e.amount;
  });

  const handleCopyViewerLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'viewer');
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice for Viewer Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
              Read-Only Dashboard
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
              {settings.roomName} · Room {settings.roomNumber}
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-[#8FA8A5] mt-1">
            This public summary view shows real-time room balances, expenses, and settlements without editing controls.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyViewerLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-[#23393B] hover:bg-neutral-50 dark:hover:bg-[#152426] text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Link Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Share Dashboard Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchToEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" /> Roommate Login
          </button>
        </div>
      </div>

      {/* Month Filter Selector */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            Month Filter:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
          >
            <option value="all">All Months</option>
            {allMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
          Active Roommates: <strong className="text-neutral-900 dark:text-white">{roommates.length}</strong>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Total Spent</span>
            <TrendingUp className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(totalSpent, currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {filteredExpenses.length} purchases logged
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Per Roommate</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(avgPerPerson, currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Equal split basis
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Room Kitty Pool</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(kittySummary.remaining, currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Communal supplies fund
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            <span>Settlement Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-2">
            {settlements.length === 0 ? 'Fully Settled' : `${settlements.length} Pending`}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {settlements.length === 0 ? 'Zero outstanding debts' : 'Transfers to square up'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Roommate Balances & Suggested Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roommate Outstanding Balances */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
              Roommate Running Balances
            </h4>
            <span className="text-[11px] text-neutral-400 font-mono">
              + Owed to you / − You owe
            </span>
          </div>

          <div className="space-y-2">
            {roommates.map((r) => {
              const bal = outstanding[r.id] || 0;
              const isCreditor = bal > 0.005;
              const isDebtor = bal < -0.005;

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-[#1E3033] bg-neutral-50/50 dark:bg-[#152426]/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <div>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                        {r.name}
                      </span>
                      {r.handle && (
                        <span className="block text-[10px] text-neutral-400 font-mono">
                          {r.handle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isCreditor
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {formatSignedMoney(bal, currencySymbol)}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {isCreditor
                        ? 'Owed by room'
                        : isDebtor
                        ? 'Owes the room'
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Settlement Transfers */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
              Optimal Settlement Plan
            </h4>
            <span className="text-[11px] text-neutral-400 font-mono">
              Fewest transfers
            </span>
          </div>

          {settlements.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-[#8FA8A5]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                All room accounts are balanced!
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                No money transfers needed.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {settlements.map((t, idx) => {
                const sender = roommateMap.get(t.from);
                const recipient = roommateMap.get(t.to);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-[#1E3033] bg-neutral-50/50 dark:bg-[#152426]/50"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {sender?.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {recipient?.name}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm tabular-nums text-neutral-900 dark:text-white">
                      {formatMoney(t.amount, currencySymbol)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expenses Feed */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
              Recent Shared Purchases
            </h4>
            <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
              Itemized ledger for the hostel room
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
            />
          </div>
        </div>

        <div className="scroll-x">
          <table className="w-full min-w-[36rem] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3">Paid by</th>
                <th className="py-2.5 px-3 text-right">Share per person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    No purchases recorded.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const payer = roommateMap.get(e.paidBy);
                  const perPerson =
                    e.split.length > 0 ? (e.amount / e.split.length).toFixed(2) : '–';

                  return (
                    <tr key={e.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#162729]">
                      <td className="py-2.5 px-3 font-mono tabular-nums text-neutral-500">
                        {e.date}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {e.what}
                        {e.notes && (
                          <span className="block text-[11px] text-neutral-400 font-normal">
                            {e.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-500">
                        {e.cat}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                        {formatMoney(e.amount, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3">
                        {e.paidBy === 'KITTY' ? (
                          <span className="text-amber-600 font-medium">Room Kitty</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: payer?.color || '#0B7A6E' }}
                            />
                            {payer?.name || e.paidBy}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-500 tabular-nums">
                        {currencySymbol}{perPerson} ({e.split.length} roommates)
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
