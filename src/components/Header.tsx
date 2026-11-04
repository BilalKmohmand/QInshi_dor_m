import React from 'react';
import { Sun, Moon, Plus, Eye, ShieldCheck } from 'lucide-react';

export type TabKey =
  | 'expenses'
  | 'payments'
  | 'balances'
  | 'settlement'
  | 'report'
  | 'kitty'
  | 'settings';

interface HeaderProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenNewExpense: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isViewerMode: boolean;
  onToggleViewerMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewExpense,
  isDarkMode,
  onToggleDarkMode,
  isViewerMode,
  onToggleViewerMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E1B1D]/95 backdrop-blur-md border-b border-neutral-200 dark:border-[#23393B] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => {
            if (!isViewerMode) onSelectTab('expenses');
          }}
          type="button"
          className="text-left cursor-pointer group"
        >
          <span className="font-display font-extrabold text-lg sm:text-xl text-neutral-900 dark:text-[#EAF3F1] tracking-tight whitespace-nowrap shrink-0 group-hover:text-[#0B7A6E] dark:group-hover:text-[#3FC5B3] transition-colors">
            Hostel Ledger
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        {isViewerMode ? (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Public Room Dashboard (View-Only Mode)</span>
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <button
              type="button"
              onClick={() => onSelectTab('expenses')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'expenses'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Expenses
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('payments')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'payments'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Payments
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('balances')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'balances'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Balances
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('settlement')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'settlement'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Settlement
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('report')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'report'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Report
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('kitty')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'kitty'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Room Kitty
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'settings'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-semibold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Settings
            </button>
          </nav>
        )}

        {/* Zone 3: Actions + theme toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={onToggleViewerMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isViewerMode
                ? 'border-neutral-300 dark:border-[#23393B] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'border-neutral-200 dark:border-[#23393B] hover:bg-neutral-100 dark:hover:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
            }`}
            title={isViewerMode ? 'Switch to Full Editor' : 'Switch to Read-Only Viewer Mode'}
          >
            {isViewerMode ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Roommate Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Viewer Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-neutral-200 dark:border-[#23393B] text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {!isViewerMode && (
            <button
              type="button"
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar (only shown in editor mode) */}
      {!isViewerMode && (
        <div className="md:hidden flex items-center overflow-x-auto px-4 border-t border-neutral-100 dark:border-[#1E3033] py-2 gap-2 text-xs">
          {(
            [
              ['expenses', 'Expenses'],
              ['payments', 'Payments'],
              ['balances', 'Balances'],
              ['settlement', 'Settlement'],
              ['report', 'Report'],
              ['kitty', 'Kitty'],
              ['settings', 'Settings'],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTab(key)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                currentTab === key
                  ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
