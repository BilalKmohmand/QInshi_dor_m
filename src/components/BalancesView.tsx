import React, { useState } from 'react';
import { Roommate, Expense, Payment } from '../types';
import {
  calculateMonthlyStats,
  calculateOutstandingBalances,
  formatMoney,
  formatSignedMoney,
} from '../utils/calculator';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

interface BalancesViewProps {
  expenses: Expense[];
  payments: Payment[];
  roommates: Roommate[];
  currencySymbol: string;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  allMonths: string[];
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  expenses,
  payments,
  roommates,
  currencySymbol,
  selectedMonth,
  onSelectMonth,
  allMonths,
}) => {
  const [viewDetail, setViewDetail] = useState<'matrix' | 'cards'>('matrix');

  const monthStats = calculateMonthlyStats(expenses, roommates, selectedMonth);
  const outstanding = calculateOutstandingBalances(expenses, payments, roommates);

  // Find max absolute outstanding balance for the visual bar scale
  let maxAbs = 1;
  roommates.forEach((r) => {
    const val = Math.abs(outstanding[r.id] || 0);
    if (val > maxAbs) maxAbs = val;
  });

  const totalOwedByDebtors = roommates.reduce((sum, r) => {
    const bal = outstanding[r.id] || 0;
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Controls & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            Month Scope:
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Total In-Flight Debt: <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">{formatMoney(totalOwedByDebtors, currencySymbol)}</strong>
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <div className="flex items-center bg-neutral-100 dark:bg-[#152426] p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewDetail('matrix')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewDetail === 'matrix'
                  ? 'bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Ledger Table
            </button>
            <button
              type="button"
              onClick={() => setViewDetail('cards')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewDetail === 'cards'
                  ? 'bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Roommate Cards
            </button>
          </div>
        </div>
      </div>

      {viewDetail === 'matrix' ? (
        /* Ledger Table View */
        <div className="overflow-x-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-[#0D181A] border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-500 dark:text-[#8FA8A5] uppercase tracking-wider">
                <th className="py-3 px-4">Roommate</th>
                <th className="py-3 px-4 text-right">Paid ({selectedMonth === 'all' ? 'All' : selectedMonth})</th>
                <th className="py-3 px-4 text-right">Share ({selectedMonth === 'all' ? 'All' : selectedMonth})</th>
                <th className="py-3 px-4 text-right">Period Net</th>
                <th className="py-3 px-4 text-right font-bold">Outstanding Balance</th>
                <th className="py-3 px-4 min-w-[140px]">Balance Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-[#23393B]">
              {roommates.map((r) => {
                const paid = monthStats.paid[r.id] || 0;
                const share = monthStats.share[r.id] || 0;
                const net = monthStats.net[r.id] || 0;
                const bal = outstanding[r.id] || 0;
                const isCreditor = bal > 0.005;
                const isDebtor = bal < -0.005;
                const isSettled = !isCreditor && !isDebtor;
                const percent = Math.min(100, Math.round((Math.abs(bal) / maxAbs) * 100));

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#162729] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {r.name}
                          </span>
                          {r.handle && (
                            <span className="block text-[11px] text-neutral-400">
                              {r.handle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(paid, currencySymbol)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(share, currencySymbol)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          net > 0.005
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : net < -0.005
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-neutral-400'
                        }
                      >
                        {formatSignedMoney(net, currencySymbol)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm">
                      <span
                        className={`font-bold ${
                          isCreditor
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDebtor
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {formatSignedMoney(bal, currencySymbol)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSettled ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Settled
                        </div>
                      ) : (
                        <div className="w-full bg-neutral-200 dark:bg-[#23393B] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCreditor
                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                : 'bg-red-500 dark:bg-red-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Roommate Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roommates.map((r) => {
            const bal = outstanding[r.id] || 0;
            const paid = monthStats.paid[r.id] || 0;
            const share = monthStats.share[r.id] || 0;
            const isCreditor = bal > 0.005;
            const isDebtor = bal < -0.005;

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {r.name}
                      </h4>
                    </div>
                    {r.handle && (
                      <span className="text-[11px] font-mono text-neutral-400">
                        {r.handle}
                      </span>
                    )}
                  </div>

                  <div className="text-2xl font-bold font-mono tabular-nums mb-1">
                    <span
                      className={
                        isCreditor
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-500'
                      }
                    >
                      {formatSignedMoney(bal, currencySymbol)}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 dark:text-[#8FA8A5] flex items-center gap-1.5 mb-4">
                    {isCreditor ? (
                      <>
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                        <span>The room owes {r.name} money</span>
                      </>
                    ) : isDebtor ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                        <span>{r.name} owes money to the room</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Completely settled up</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-[#1E3033] grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Paid:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                      {formatMoney(paid, currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Consumed:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                      {formatMoney(share, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Explanatory Guide Box */}
      <div className="bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 text-xs text-neutral-600 dark:text-[#8FA8A5] space-y-1.5">
        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
          How to interpret room balances:
        </div>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+ Positive (Green)</strong>: The group owes you. You spent more on behalf of the room than your share.
          </li>
          <li>
            <strong className="text-red-600 dark:text-red-400 font-mono">− Negative (Red)</strong>: You owe the group. You consumed items that someone else paid for.
          </li>
          <li>
            <strong>Outstanding Balance</strong> reflects running all-time math, including all recorded cash repayments.
          </li>
        </ul>
      </div>
    </div>
  );
};
