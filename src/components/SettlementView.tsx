import React, { useState } from 'react';
import { Roommate, Expense, Payment, SettlementTransfer } from '../types';
import {
  calculateOutstandingBalances,
  calculateOptionASettlements,
  calculateOptionBSettlements,
  formatMoney,
  generateGroupSummaryText,
} from '../utils/calculator';
import {
  Share2,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Copy,
} from 'lucide-react';

interface SettlementViewProps {
  expenses: Expense[];
  payments: Payment[];
  roommates: Roommate[];
  currencySymbol: string;
  roomName: string;
  coordinatorId: string;
  onSelectCoordinator: (id: string) => void;
  onRecordSettlementPayment: (transfer: SettlementTransfer) => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  expenses,
  payments,
  roommates,
  currencySymbol,
  roomName,
  coordinatorId,
  onSelectCoordinator,
  onRecordSettlementPayment,
}) => {
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('B');
  const [copied, setCopied] = useState(false);

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));
  const outstanding = calculateOutstandingBalances(expenses, payments, roommates);

  const optionASettlements = calculateOptionASettlements(outstanding, coordinatorId);
  const optionBSettlements = calculateOptionBSettlements(outstanding);

  const currentSettlements = activeOption === 'A' ? optionASettlements : optionBSettlements;

  const coordinator = roommateMap.get(coordinatorId);

  const handleCopySummary = async () => {
    const text = generateGroupSummaryText(
      roomName,
      roommates,
      outstanding,
      optionBSettlements,
      currencySymbol
    );

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isAllSettled = currentSettlements.length === 0;

  return (
    <div className="space-y-6">
      {/* Top action bar: Share to Group Chat & Option switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Month-End Settlement Engine
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Calculate the exact minimal transfers needed to return every roommate's balance to {currencySymbol}0.00
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied to Clipboard!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" /> Copy for WhatsApp / WeChat
            </>
          )}
        </button>
      </div>

      {/* Settlement Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option B: Person to Person */}
        <div
          onClick={() => setActiveOption('B')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeOption === 'B'
              ? 'border-[#0B7A6E] dark:border-[#3FC5B3] bg-[#D7EEEA]/30 dark:bg-[#123A36]/30 ring-2 ring-[#0B7A6E]/30'
              : 'border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#111D1F] hover:border-neutral-300 dark:hover:border-[#325255]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Option B · Person to Person (Recommended)
              </h4>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1C2C2F] text-neutral-700 dark:text-[#8FA8A5]">
              {optionBSettlements.length} transfers
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-[#8FA8A5] leading-relaxed">
            Greedy debt minimization algorithm. Matches the biggest debtors with the biggest creditors directly. No middleman needed.
          </p>
        </div>

        {/* Option A: Through Coordinator */}
        <div
          onClick={() => setActiveOption('A')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeOption === 'A'
              ? 'border-[#0B7A6E] dark:border-[#3FC5B3] bg-[#D7EEEA]/30 dark:bg-[#123A36]/30 ring-2 ring-[#0B7A6E]/30'
              : 'border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#111D1F] hover:border-neutral-300 dark:hover:border-[#325255]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Option A · Through Coordinator
              </h4>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1C2C2F] text-neutral-700 dark:text-[#8FA8A5]">
              {optionASettlements.length} transfers
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-[#8FA8A5] leading-relaxed">
            All debtors transfer to one trusted roommate (the coordinator/banker), who distributes funds to creditors.
          </p>
        </div>
      </div>

      {/* Coordinator configuration if Option A is chosen */}
      {activeOption === 'A' && (
        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-lg text-xs">
          <span className="font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
            Designated Coordinator:
          </span>
          <select
            value={coordinatorId}
            onChange={(e) => onSelectCoordinator(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-[#23393B] bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#0B7A6E]"
          >
            {roommates.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className="text-neutral-400 hidden sm:inline">
            Everyone settles through {coordinator?.name}.
          </span>
        </div>
      )}

      {/* Settlement Transfers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
          <span>
            {activeOption === 'B' ? 'Direct Pairwise Settlement Transfers' : `Transfers via Coordinator (${coordinator?.name})`}
          </span>
          <span>
            {currentSettlements.length === 0 ? 'All Settled' : `${currentSettlements.length} Transfers Required`}
          </span>
        </div>

        {isAllSettled ? (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100 font-display">
              Everyone is completely settled!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
              Every roommate's outstanding balance is {currencySymbol}0.00. No pending debts exist.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentSettlements.map((transfer, idx) => {
              const sender = roommateMap.get(transfer.from);
              const receiver = roommateMap.get(transfer.to);

              return (
                <div
                  key={`${transfer.from}-${transfer.to}-${idx}`}
                  className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-[#325255] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-[#1C2C2F] text-neutral-600 dark:text-[#8FA8A5] flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sender?.color || '#0B7A6E' }}
                        />
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {sender?.name}
                        </span>
                        {sender?.handle && (
                          <span className="text-[11px] text-neutral-400 font-mono hidden md:inline">
                            ({sender.handle})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-neutral-400">
                        <span className="text-xs">pays</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: receiver?.color || '#0B7A6E' }}
                        />
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {receiver?.name}
                        </span>
                        {receiver?.handle && (
                          <span className="text-[11px] text-neutral-400 font-mono hidden md:inline">
                            ({receiver.handle})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#1E3033]">
                    <span className="font-mono font-bold text-base tabular-nums text-neutral-900 dark:text-white">
                      {formatMoney(transfer.amount, currencySymbol)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRecordSettlementPayment(transfer)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs whitespace-nowrap"
                    >
                      Log It (Mark Paid)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 text-xs text-neutral-600 dark:text-[#8FA8A5]">
        <div className="font-semibold text-neutral-900 dark:text-white mb-1">
          Settlement Protocol:
        </div>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Share the breakdown in the room WhatsApp / WeChat group using the copy button above.</li>
          <li>Each sender executes their transfer using cash or preferred digital wallet (WeChat Pay / Alipay / UPI).</li>
          <li>Click <strong>"Log It (Mark Paid)"</strong> on each item. The system records the payment into the ledger and balances update to zero.</li>
        </ol>
      </div>
    </div>
  );
};
