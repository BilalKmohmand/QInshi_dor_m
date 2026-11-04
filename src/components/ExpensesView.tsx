import React, { useState } from 'react';
import { Expense, Roommate } from '../types';
import { formatMoney, monthOf } from '../utils/calculator';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Receipt,
  Users,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  roommates: Roommate[];
  categories: string[];
  currencySymbol: string;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDuplicateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onClearSamples: () => void;
  onRestoreSamples: () => void;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  allMonths: string[];
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  roommates,
  categories,
  currencySymbol,
  onAddExpense,
  onEditExpense,
  onDuplicateExpense,
  onDeleteExpense,
  onClearSamples,
  onRestoreSamples,
  selectedMonth,
  onSelectMonth,
  allMonths,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedPayer, setSelectedPayer] = useState('all');

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));

  const sampleCount = expenses.filter((e) => e.sample).length;

  const filteredExpenses = expenses
    .filter((e) => {
      if (selectedMonth !== 'all' && monthOf(e.date) !== selectedMonth) return false;
      if (selectedCat !== 'all' && e.cat !== selectedCat) return false;
      if (selectedPayer !== 'all' && e.paidBy !== selectedPayer) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesWhat = e.what.toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesPayer = (roommateMap.get(e.paidBy)?.name || '').toLowerCase().includes(q);
        if (!matchesWhat && !matchesNotes && !matchesPayer) return false;
      }
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Sample notice banner */}
      {sampleCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Showing <strong>{sampleCount} sample rows</strong> to preview hostel math. Delete them anytime to start clean.
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSamples}
            className="px-3 py-1 font-semibold rounded bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 transition-colors"
          >
            Delete Sample Rows
          </button>
        </div>
      ) : (
        expenses.length === 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-lg text-xs text-neutral-600 dark:text-[#8FA8A5]">
            <span>Clean slate active. Want to see how the ledger calculates?</span>
            <button
              type="button"
              onClick={onRestoreSamples}
              className="flex items-center gap-1 font-medium text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore sample data
            </button>
          </div>
        )
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search purchases, notes, or payer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
            >
              <option value="all">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Payer Filter */}
            <select
              value={selectedPayer}
              onChange={(e) => setSelectedPayer(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
            >
              <option value="all">All Payers</option>
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  Paid by {r.name}
                </option>
              ))}
              <option value="KITTY">Paid from Kitty</option>
            </select>

            {/* Add Expense Action */}
            <button
              type="button"
              onClick={onAddExpense}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Log Expense
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-neutral-400 dark:text-[#8FA8A5] font-mono text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              selectedCat === 'all'
                ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-200 dark:hover:bg-[#1E3033]'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCat === c
                  ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                  : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-200 dark:hover:bg-[#1E3033]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metric bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-neutral-100/70 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-lg text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-neutral-500 dark:text-[#8FA8A5]">
            Filtered: <strong>{filteredExpenses.length}</strong> items
          </span>
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-700 dark:text-[#E6F0EE]">
            Total Spend: <strong className="tabular-nums text-neutral-900 dark:text-white font-bold">{formatMoney(totalFilteredAmount, currencySymbol)}</strong>
          </span>
        </div>
        {filteredExpenses.length > 0 && (
          <div className="text-neutral-500 dark:text-[#8FA8A5]">
            Avg / transaction: <span className="tabular-nums font-semibold">{formatMoney(totalFilteredAmount / filteredExpenses.length, currencySymbol)}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 dark:bg-[#0D181A] border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-500 dark:text-[#8FA8A5] uppercase tracking-wider">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Purchase</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3">Paid by</th>
              <th className="py-3 px-3">Split between</th>
              <th className="py-3 px-3 text-right">Each pays</th>
              <th className="py-3 px-3 text-center">Month</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-[#23393B]">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-400 dark:text-[#8FA8A5]">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-[#23393B]" />
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    No expenses match the current filter.
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Click "Log Expense" to add a new shared room purchase.
                  </p>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => {
                const payer = roommateMap.get(e.paidBy);
                const splitMembers = e.split.map((id) => roommateMap.get(id)?.name || id);
                const eachCost =
                  e.split.length > 0 ? (e.amount / e.split.length).toFixed(2) : '–';

                return (
                  <tr
                    key={e.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#162729] transition-colors"
                  >
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-neutral-600 dark:text-[#8FA8A5]">
                      {e.date}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <span>{e.what}</span>
                        {e.sample && (
                          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            Sample
                          </span>
                        )}
                      </div>
                      {e.notes && (
                        <div className="text-[11px] text-neutral-400 dark:text-[#7A9390] mt-0.5">
                          {e.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-neutral-600 dark:text-[#8FA8A5] text-[11px]">
                        {e.cat}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                      {formatMoney(e.amount, currencySymbol)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {e.paidBy === 'KITTY' ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Room Kitty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-medium">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: payer?.color || '#0B7A6E' }}
                          />
                          {payer?.name || e.paidBy}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[180px] text-neutral-600 dark:text-[#8FA8A5]" title={splitMembers.join(', ')}>
                          {splitMembers.join(', ')}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                          ({e.split.length})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap text-neutral-500 dark:text-[#8FA8A5]">
                      {e.splitMode === 'equal' ? (
                        `${currencySymbol}${eachCost}`
                      ) : (
                        <span className="text-[10px] font-mono text-[#0B7A6E] dark:text-[#3FC5B3]">
                          Custom split
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                      {monthOf(e.date)}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateExpense(e)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
                          title="Duplicate expense"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditExpense(e)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(e.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
