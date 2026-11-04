import React from 'react';
import { Expense, Roommate } from '../types';
import {
  calculateMonthlyStats,
  formatMoney,
  monthOf,
} from '../utils/calculator';
import {
  TrendingUp,
  Receipt,
  Users,
  Target,
  Award,
} from 'lucide-react';

interface ReportViewProps {
  expenses: Expense[];
  roommates: Roommate[];
  categories: string[];
  currencySymbol: string;
  monthlyBudget: number;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  allMonths: string[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  expenses,
  roommates,
  categories,
  currencySymbol,
  monthlyBudget,
  selectedMonth,
  onSelectMonth,
  allMonths,
}) => {
  const roommateMap = new Map(roommates.map((r) => [r.id, r]));

  // Filter expenses by selected month
  const filtered = expenses.filter((e) =>
    selectedMonth === 'all' ? true : monthOf(e.date) === selectedMonth
  );

  const totalSpent = filtered.reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = filtered.length;
  const avgPerRoommate = roommates.length > 0 ? totalSpent / roommates.length : 0;

  // Find highest expense
  const highestExpense: Expense | null = filtered.reduce<Expense | null>((maxExp, e) => {
    if (!maxExp || e.amount > maxExp.amount) {
      return e;
    }
    return maxExp;
  }, null);


  // Calculate category breakdowns
  const categoryTotals: Record<string, number> = {};
  categories.forEach((c) => {
    categoryTotals[c] = 0;
  });

  filtered.forEach((e) => {
    categoryTotals[e.cat] = (categoryTotals[e.cat] || 0) + e.amount;
  });

  let maxCategorySpent = 1;
  Object.values(categoryTotals).forEach((val) => {
    if (val > maxCategorySpent) maxCategorySpent = val;
  });

  // Calculate monthly stats for roommates
  const stats = calculateMonthlyStats(expenses, roommates, selectedMonth);

  // Find top payer
  let topPayerId = '';
  let maxPaid = -1;
  roommates.forEach((r) => {
    const p = stats.paid[r.id] || 0;
    if (p > maxPaid) {
      maxPaid = p;
      topPayerId = r.id;
    }
  });
  const topPayer = roommateMap.get(topPayerId);

  // Budget calculations
  const budgetPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;
  const isOverBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;

  return (
    <div className="space-y-6">
      {/* Month Picker Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Room Financial & Consumption Report
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Categorical analysis, budget tracking, and consumption shares
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            Month:
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
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] flex items-center justify-between">
            <span>Total Room Spent</span>
            <TrendingUp className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(totalSpent, currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across {expenseCount} transactions
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] flex items-center justify-between">
            <span>Per Roommate Avg</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {formatMoney(avgPerRoommate, currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Equal split equivalent
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] flex items-center justify-between">
            <span>Highest Expense</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-2">
            {highestExpense ? formatMoney(highestExpense.amount, currencySymbol) : '—'}
          </div>
          <div className="text-[11px] text-neutral-400 truncate mt-1">
            {highestExpense ? highestExpense.what : 'No records'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] flex items-center justify-between">
            <span>Top Spender</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-2 truncate">
            {topPayer ? topPayer.name : '—'}
          </div>
          <div className="text-[11px] font-mono text-neutral-400 mt-1">
            Fronted {formatMoney(maxPaid, currencySymbol)}
          </div>
        </div>
      </div>

      {/* Monthly Budget Tracker Bar */}
      {monthlyBudget > 0 && (
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono">
                Monthly Room Budget Target
              </span>
            </div>
            <span className="text-xs font-mono font-semibold">
              <span className={isOverBudget ? 'text-red-500 font-bold' : 'text-neutral-900 dark:text-white'}>
                {formatMoney(totalSpent, currencySymbol)}
              </span>{' '}
              / {formatMoney(monthlyBudget, currencySymbol)} ({budgetPercent}%)
            </span>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-[#152426] h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isOverBudget
                  ? 'bg-red-500'
                  : budgetPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-[#0B7A6E] dark:bg-[#3FC5B3]'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-[#8FA8A5] font-mono pt-1">
            <span>
              {isOverBudget
                ? `Exceeded room budget by ${formatMoney(totalSpent - monthlyBudget, currencySymbol)}`
                : `${formatMoney(monthlyBudget - totalSpent, currencySymbol)} remaining in budget`}
            </span>
            <span>Room Target: {formatMoney(monthlyBudget, currencySymbol)}</span>
          </div>
        </div>
      )}

      {/* Two Column Grid: Category Breakdown vs Roommate Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display">
            Spending by Category
          </h4>

          <div className="space-y-3">
            {categories.map((cat) => {
              const amount = categoryTotals[cat] || 0;
              const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              const barWidth = maxCategorySpent > 0 ? Math.round((amount / maxCategorySpent) * 100) : 0;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {cat}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatMoney(amount, currencySymbol)}
                      </span>
                      <span className="text-neutral-400 text-[11px] w-9 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100 dark:bg-[#152426] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B7A6E] dark:bg-[#3FC5B3] rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roommate Paid vs Consumed */}
        <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display">
            Roommate Paid vs Consumption Share
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
                  <th className="py-2">Roommate</th>
                  <th className="py-2 text-right">Fronted (Paid)</th>
                  <th className="py-2 text-right">Consumed (Share)</th>
                  <th className="py-2 text-right">Period Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
                {roommates.map((r) => {
                  const paid = stats.paid[r.id] || 0;
                  const share = stats.share[r.id] || 0;
                  const net = paid - share;

                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.name}
                        </span>
                      </td>

                      <td className="py-2.5 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatMoney(paid, currencySymbol)}
                      </td>

                      <td className="py-2.5 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatMoney(share, currencySymbol)}
                      </td>

                      <td className="py-2.5 text-right font-mono tabular-nums font-semibold">
                        <span
                          className={
                            net > 0.005
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : net < -0.005
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-neutral-400'
                          }
                        >
                          {net > 0 ? '+' : ''}
                          {formatMoney(net, currencySymbol)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
