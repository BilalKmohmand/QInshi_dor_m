import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, HelpCircle } from 'lucide-react';

export const RulesSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-neutral-200 dark:border-[#23393B] pt-8 pb-12 mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Hostel Room Ground Rules & Settlement Guide
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-mono text-neutral-500 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
        >
          <span>{isOpen ? 'Hide Guide' : 'Show Guide'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-lg p-3 text-xs space-y-1">
              <span className="font-mono text-[11px] text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold uppercase">
                Step 1
              </span>
              <div className="font-bold text-neutral-900 dark:text-white">
                Log the expense
              </div>
              <p className="text-neutral-500 dark:text-[#8FA8A5] text-[11px] leading-relaxed">
                Date, description, category, total cost, and who fronted the cash.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-lg p-3 text-xs space-y-1">
              <span className="font-mono text-[11px] text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold uppercase">
                Step 2
              </span>
              <div className="font-bold text-neutral-900 dark:text-white">
                Untick who was absent
              </div>
              <p className="text-neutral-500 dark:text-[#8FA8A5] text-[11px] leading-relaxed">
                All roommates are ticked by default. A meal for 3 splits 3 ways automatically.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-lg p-3 text-xs space-y-1">
              <span className="font-mono text-[11px] text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold uppercase">
                Step 3
              </span>
              <div className="font-bold text-neutral-900 dark:text-white">
                Track repayments
              </div>
              <p className="text-neutral-500 dark:text-[#8FA8A5] text-[11px] leading-relaxed">
                When cash or digital transfers move, record sender and recipient.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-lg p-3 text-xs space-y-1">
              <span className="font-mono text-[11px] text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold uppercase">
                Step 4
              </span>
              <div className="font-bold text-neutral-900 dark:text-white">
                Read the balances
              </div>
              <p className="text-neutral-500 dark:text-[#8FA8A5] text-[11px] leading-relaxed">
                Per month or all-time: green means owed to you, red means you owe the room.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-lg p-3 text-xs space-y-1">
              <span className="font-mono text-[11px] text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold uppercase">
                Step 5
              </span>
              <div className="font-bold text-neutral-900 dark:text-white">
                Settle the month
              </div>
              <p className="text-neutral-500 dark:text-[#8FA8A5] text-[11px] leading-relaxed">
                Pick coordinator or direct P2P transfers. Hit "Log It" to square up to zero.
              </p>
            </div>
          </div>

          {/* Room Rules Two-Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-sm font-display text-neutral-900 dark:text-white">
                Honesty & Logging Habits
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-neutral-600 dark:text-[#8FA8A5]">
                <li>Log it the same day. Delaying leads to lost receipts and disputed numbers.</li>
                <li>Only shared communal items belong here. Personal food/snacks stay personal.</li>
                <li>Whoever pays, logs it. If someone asked you to pick up water bottles, log it on return.</li>
                <li>Use custom splits if someone ate significantly extra or brought a guest.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-sm font-display text-neutral-900 dark:text-white">
                Spreadsheet Compatibility
              </h4>
              <p className="text-neutral-600 dark:text-[#8FA8A5] leading-relaxed">
                This app runs the exact same accounting formulas as the shared Google Sheet ledger.
                You can export a full CSV at any time to open in Microsoft Excel or Google Sheets.
              </p>
              <a
                href="https://docs.google.com/spreadsheets/d/1v_TEqwUInN4VUoAfnx37h14WCr3KjNTnVgFnnBD_WNM/edit?usp=sharing"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-medium text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline pt-1"
              >
                <span>Inspect original Google Sheet template</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
