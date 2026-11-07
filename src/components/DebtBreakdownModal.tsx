import React, { useState } from 'react';
import { Expense, Payment, Roommate, PaymentRequest } from '../types';
import { calculatePairwiseDebt, formatMoney, formatSignedMoney } from '../utils/calculator';
import {
  X,
  ArrowRight,
  Receipt,
  Calendar,
  Users,
  Send,
  Filter,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface DebtBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  myRoommateId: string;
  otherRoommateId: string;
  roommates: Roommate[];
  expenses: Expense[];
  payments: Payment[];
  paymentRequests: PaymentRequest[];
  currencySymbol: string;
  onRequestPayment: (fromId: string, toId: string, amount: number) => void;
}

export const DebtBreakdownModal: React.FC<DebtBreakdownModalProps> = ({
  isOpen,
  onClose,
  myRoommateId,
  otherRoommateId,
  roommates,
  expenses,
  payments,
  paymentRequests,
  currencySymbol,
  onRequestPayment,
}) => {
  const [filterDirection, setFilterDirection] = useState<'all' | 'i_owe' | 'they_owe'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen || !otherRoommateId || !myRoommateId) return null;

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));
  const myRoommate = roommateMap.get(myRoommateId);
  const otherRoommate = roommateMap.get(otherRoommateId);

  const pairwise = calculatePairwiseDebt(
    myRoommateId,
    otherRoommateId,
    expenses,
    payments,
    roommates
  );

  const categories = Array.from(new Set(pairwise.items.map((i) => i.category)));

  const filteredItems = pairwise.items.filter((item) => {
    if (filterDirection !== 'all' && item.direction !== filterDirection) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  // Find verified payments between these two
  const directPayments = payments.filter(
    (p) =>
      (p.from === myRoommateId && p.to === otherRoommateId) ||
      (p.from === otherRoommateId && p.to === myRoommateId)
  );

  const pendingBetweenThem = paymentRequests.filter(
    (pr) =>
      pr.status === 'pending' &&
      ((pr.fromRoommate === myRoommateId && pr.toRoommate === otherRoommateId) ||
       (pr.fromRoommate === otherRoommateId && pr.toRoommate === myRoommateId))
  );

  const iOweThem = pairwise.netBalance < -0.01;
  const theyOweMe = pairwise.netBalance > 0.01;
  const isSettled = !iOweThem && !theyOweMe;
  const absoluteNet = Math.abs(pairwise.netBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl shadow-2xl p-5 sm:p-6 my-6 text-neutral-900 dark:text-[#E6F0EE] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-[#23393B] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
              <span>Purchase-by-Purchase Trace</span>
              <span>·</span>
              <span>Audit Ledger</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-neutral-900 dark:text-white mt-1 flex items-center gap-2 flex-wrap">
              <span>{myRoommate?.name}</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
              <span>{otherRoommate?.name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="my-4 p-4 rounded-xl border bg-neutral-50 dark:bg-[#152426] border-neutral-200 dark:border-[#23393B] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] block">
                Net Outstanding Position
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-0.5">
                <span
                  className={
                    theyOweMe
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : iOweThem
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-neutral-500'
                  }
                >
                  {formatSignedMoney(pairwise.netBalance, currencySymbol)}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-[#8FA8A5] mt-1">
                {theyOweMe
                  ? `${otherRoommate?.name} owes you ${formatMoney(absoluteNet, currencySymbol)} net.`
                  : iOweThem
                  ? `You owe ${otherRoommate?.name} ${formatMoney(absoluteNet, currencySymbol)} net.`
                  : `You and ${otherRoommate?.name} are completely settled up!`}
              </p>
            </div>

            {iOweThem && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestPayment(myRoommateId, otherRoommateId, absoluteNet);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors whitespace-nowrap shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Repayment to {otherRoommate?.name}</span>
              </button>
            )}
          </div>

          {/* Math formula explanation strip */}
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-[#23393B] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">They Paid (You shared):</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {formatMoney(pairwise.iOweThemGross, currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">You Paid (They shared):</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {formatMoney(pairwise.theyOweMeGross, currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">You Repaid Them:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                −{formatMoney(pairwise.iPaidThemVerified, currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">They Repaid You:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                −{formatMoney(pairwise.theyPaidMeVerified, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Pending payment request alert if any */}
        {pendingBetweenThem.length > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>{pendingBetweenThem.length} pending payment request(s)</strong> awaiting recipient verification.
                Pending amounts do not reduce verified balance until approved.
              </span>
            </div>
          </div>
        )}

        {/* Filter controls */}
        <div className="flex items-center justify-between gap-2 pb-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterDirection('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterDirection === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
              }`}
            >
              All Purchases ({pairwise.items.length})
            </button>
            <button
              onClick={() => setFilterDirection('i_owe')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterDirection === 'i_owe'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
              }`}
            >
              They Paid (I Owe)
            </button>
            <button
              onClick={() => setFilterDirection('they_owe')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterDirection === 'they_owe'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
              }`}
            >
              I Paid (They Owe)
            </button>
          </div>

          {categories.length > 1 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Scrollable list of underlying purchase items */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No shared purchases found for this filter.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isIOwe = item.direction === 'i_owe';

              return (
                <div
                  key={item.expenseId}
                  className="p-3 rounded-lg border border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#152426] hover:border-neutral-300 dark:hover:border-[#355255] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                          {item.what}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1C2C2F] text-neutral-500">
                          {item.category}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {item.date}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-500 dark:text-[#8FA8A5] mt-1 flex items-center gap-3">
                        <span>Total purchase: {formatMoney(item.originalAmount, currencySymbol)}</span>
                        <span>·</span>
                        <span>Split {item.splitMembersCount} ways</span>
                        <span>·</span>
                        <span>Paid by: {item.paidByName}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-bold text-sm tabular-nums ${
                          isIOwe
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isIOwe ? '−' : '+'}
                        {formatMoney(item.amountOwed, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {isIOwe ? 'Your share' : 'Their share'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Direct verified payments applied */}
        {directPayments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-[#23393B] shrink-0 text-xs">
            <div className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Verified Direct Repayments Log ({directPayments.length}):
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {directPayments.map((p) => {
                const isSentByMe = p.from === myRoommateId;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1 px-2 rounded bg-neutral-100/70 dark:bg-[#1C2C2F] text-[11px] font-mono"
                  >
                    <span>
                      {p.date} · {isSentByMe ? 'You paid' : `${otherRoommate?.name} paid`}
                      {p.note ? ` (${p.note})` : ''}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(p.amount, currencySymbol)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 dark:border-[#23393B] flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>All amounts verified against Supabase records</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-300 dark:border-[#23393B] hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
