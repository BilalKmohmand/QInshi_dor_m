import React from 'react';
import {
  Sun,
  Moon,
  Plus,
  Eye,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Bell,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { UserSession, Roommate } from '../types';

export type TabKey =
  | 'overview'
  | 'roommates'
  | 'expenses'
  | 'payments'
  | 'requests'
  | 'balances'
  | 'settlement'
  | 'report'
  | 'kitty'
  | 'settings'
  | 'audit';

interface HeaderProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenNewExpense: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userSession: UserSession;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  pendingRequestsCount?: number;
  roommates: Roommate[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewExpense,
  isDarkMode,
  onToggleDarkMode,
  userSession,
  onOpenAuthModal,
  onLogout,
  unreadNotificationsCount = 0,
  pendingRequestsCount = 0,
  roommates,
}) => {
  const currentRoommate = roommates.find((r) => r.id === userSession.roommateId);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E1B1D]/95 backdrop-blur-md border-b border-neutral-200 dark:border-[#23393B] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8 h-16">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (userSession.role === 'admin') onSelectTab('expenses');
            }}
            type="button"
            className="text-left cursor-pointer group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B7A6E] dark:bg-[#3FC5B3] flex items-center justify-center text-white dark:text-[#04201C] font-bold text-sm shadow-xs">
              ¥
            </div>
            <div>
              <span className="font-display font-extrabold text-base sm:text-lg text-neutral-900 dark:text-[#EAF3F1] tracking-tight whitespace-nowrap block group-hover:text-[#0B7A6E] dark:group-hover:text-[#3FC5B3] transition-colors leading-none">
                Hostel Ledger
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block tracking-wider uppercase mt-0.5">
                Room 304 · Qinshi
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (only for Admin suite in desktop; Roommates have their own rich nav) */}
        {userSession.role === 'admin' ? (
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => onSelectTab('expenses')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'expenses'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
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
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Payments
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('requests')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1 ${
                currentTab === 'requests'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('balances')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'balances'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
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
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Settlement
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('roommates')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'roommates'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Roommates
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('report')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'report'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
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
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Kitty
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'settings'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Settings
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'audit'
                  ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold border-b-2 border-[#0B7A6E] dark:border-[#3FC5B3]'
                  : 'text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Audit Log
            </button>
          </nav>
        ) : userSession.role === 'roommate' ? (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-[#8FA8A5]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentRoommate?.color || '#0B7A6E' }}
            />
            <span>Logged in as <strong>{userSession.roommateName}</strong></span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Public Room Dashboard (View-Only Mode)</span>
          </div>
        )}

        {/* Zone 3: Actions + Theme + Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Profile / Login status pill */}
          {userSession.isLoggedIn ? (
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#152426] p-1 rounded-xl border border-neutral-200 dark:border-[#23393B]">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-[#1E3033] transition-colors"
                title="Switch account"
              >
                {userSession.role === 'admin' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">Admin (Bilal)</span>
                  </>
                ) : (
                  <>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: currentRoommate?.color || '#0B7A6E' }}
                    />
                    <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[90px] sm:max-w-none">
                      {userSession.roommateName}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-white dark:hover:bg-[#1E3033] transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-neutral-200 dark:border-[#23393B] text-neutral-600 dark:text-[#8FA8A5] hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* New Expense button (only visible to admin or logged in roommates) */}
          {userSession.isLoggedIn && (
            <button
              type="button"
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Expense</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Mobile Sub-nav (only in admin mode) */}
      {userSession.role === 'admin' && (
        <div className="lg:hidden chip-scroll flex items-center px-3 sm:px-4 border-t border-neutral-100 dark:border-[#1E3033] py-2 gap-1.5 text-xs pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {(
            [
              ['expenses', 'Expenses'],
              ['payments', 'Payments'],
              ['requests', `Requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ''}`],
              ['balances', 'Balances'],
              ['settlement', 'Settle'],
              ['roommates', 'People'],
              ['report', 'Report'],
              ['kitty', 'Kitty'],
              ['settings', 'Settings'],
              ['audit', 'Audit'],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTab(key)}
              className={`min-h-9 px-3 py-2 rounded-md whitespace-nowrap transition-colors shrink-0 ${
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
