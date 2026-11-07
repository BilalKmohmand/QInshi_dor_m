import React, { useState } from 'react';
import {
  Roommate,
  Expense,
  Payment,
  PaymentRequest,
  RoomSettings,
  AppNotification,
  AuditLog,
} from '../types';
import {
  calculateAllPairwiseForRoommate,
  calculateMonthlyStats,
  formatMoney,
  formatSignedMoney,
  monthOf,
} from '../utils/calculator';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Send,
  Clock,
  History,
  Bell,
  BarChart3,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  ExternalLink,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface RoommateDashboardProps {
  myRoommateId: string;
  roommates: Roommate[];
  expenses: Expense[];
  payments: Payment[];
  paymentRequests: PaymentRequest[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: RoomSettings;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  allMonths: string[];
  onOpenBreakdown: (otherId: string) => void;
  onOpenPaymentRequest: (fromId: string, toId: string, defaultAmount?: number) => void;
  onApprovePaymentRequest: (request: PaymentRequest) => void;
  onRejectPaymentRequest: (requestId: string, reason?: string) => void;
  onMarkNotificationAsRead: (id: string) => void;
  onUpdateMyProfile: (handle: string, pin?: string) => void;
}

export type RoommateTab =
  | 'overview'
  | 'who_i_owe'
  | 'who_owes_me'
  | 'my_expenses'
  | 'my_payments'
  | 'requests'
  | 'history'
  | 'notifications'
  | 'reports'
  | 'profile';

export const RoommateDashboard: React.FC<RoommateDashboardProps> = ({
  myRoommateId,
  roommates,
  expenses,
  payments,
  paymentRequests,
  notifications,
  auditLogs,
  settings,
  selectedMonth,
  onSelectMonth,
  allMonths,
  onOpenBreakdown,
  onOpenPaymentRequest,
  onApprovePaymentRequest,
  onRejectPaymentRequest,
  onMarkNotificationAsRead,
  onUpdateMyProfile,
}) => {
  const [activeTab, setActiveTab] = useState<RoommateTab>('overview');
  const [handleInput, setHandleInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showMyPin, setShowMyPin] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const currencySymbol = settings.currencySymbol;
  const roommateMap = new Map(roommates.map((r) => [r.id, r]));
  const myRoommate = roommateMap.get(myRoommateId) || {
    id: myRoommateId,
    name: 'Roommate',
    color: '#0B7A6E',
    handle: '',
  };

  // Pairwise Calculations
  const pairwise = calculateAllPairwiseForRoommate(
    myRoommateId,
    roommates,
    expenses,
    payments,
    paymentRequests
  );

  // My expenses (where I paid or am part of split)
  const myExpenses = expenses.filter(
    (e) => e.paidBy === myRoommateId || e.split.includes(myRoommateId)
  );

  // My direct payments (where I was from or to)
  const myPayments = payments.filter(
    (p) => p.from === myRoommateId || p.to === myRoommateId
  );

  // Payment requests where I am the recipient (need my approval)
  const incomingRequests = paymentRequests.filter(
    (pr) => pr.toRoommate === myRoommateId && pr.status === 'pending'
  );

  // Payment requests I submitted (waiting for other's approval)
  const outgoingRequests = paymentRequests.filter(
    (pr) => pr.fromRoommate === myRoommateId
  );

  // Monthly stats for my spend
  const monthStats = calculateMonthlyStats(expenses, roommates, selectedMonth);
  const myMonthPaid = monthStats.paid[myRoommateId] || 0;
  const myMonthShare = monthStats.share[myRoommateId] || 0;

  // Unread notifications for me
  const myNotifications = notifications.filter(
    (n) => n.recipientId === myRoommateId || n.recipientId === 'ALL'
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMyProfile(handleInput.trim() || myRoommate.handle || '', pinInput.trim() || undefined);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-xs"
            style={{ backgroundColor: myRoommate.color }}
          >
            {myRoommate.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Personal Roommate Portal · Room {settings.roomNumber}
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-neutral-900 dark:text-white">
              {myRoommate.name}'s Account
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
          >
            <option value="all">All Months</option>
            {allMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onOpenPaymentRequest(myRoommateId, roommates.find((r) => r.id !== myRoommateId)?.id || '')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pay Someone</span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-1.5 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> My Dashboard
        </button>

        <button
          onClick={() => setActiveTab('who_i_owe')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'who_i_owe'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-red-400" /> Who I Owe ({pairwise.whoIOwe.length})
        </button>

        <button
          onClick={() => setActiveTab('who_owes_me')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'who_owes_me'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Who Owes Me ({pairwise.whoOwesMe.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-amber-600 text-white font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Payment Requests</span>
          {incomingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_expenses')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'my_expenses'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" /> My Expenses
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <History className="w-3.5 h-3.5" /> History
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Reports
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
              : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#152426]'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Profile
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards with strict colors */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Red: Total I Owe */}
            <div
              onClick={() => setActiveTab('who_i_owe')}
              className="cursor-pointer bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] hover:border-red-300 dark:hover:border-red-900 rounded-2xl p-4 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                <span>I Owe to Others</span>
                <ArrowUpRight className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-2">
                {formatMoney(pairwise.totalOwedByMe, currencySymbol)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                <span>Across {pairwise.whoIOwe.length} roommates</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Green: Total Others Owe Me */}
            <div
              onClick={() => setActiveTab('who_owes_me')}
              className="cursor-pointer bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] hover:border-emerald-300 dark:hover:border-emerald-900 rounded-2xl p-4 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                <span>Others Owe Me</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
                {formatMoney(pairwise.totalOwedToMe, currencySymbol)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                <span>From {pairwise.whoOwesMe.length} roommates</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Net Position */}
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                Net Personal Balance
              </div>
              <div
                className={`text-2xl font-bold font-mono tabular-nums mt-2 ${
                  pairwise.myNetPosition > 0.01
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : pairwise.myNetPosition < -0.01
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-500'
                }`}
              >
                {formatSignedMoney(pairwise.myNetPosition, currencySymbol)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {pairwise.myNetPosition > 0.01
                  ? 'Overall in profit / creditor'
                  : pairwise.myNetPosition < -0.01
                  ? 'Overall debtor'
                  : 'Completely balanced'}
              </div>
            </div>

            {/* Orange: Pending Payment Requests */}
            <div
              onClick={() => setActiveTab('requests')}
              className="cursor-pointer bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] hover:border-amber-300 dark:hover:border-amber-900 rounded-2xl p-4 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-2">
                {incomingRequests.length} pending
              </div>
              <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                <span>{incomingRequests.length > 0 ? 'Requires your review' : 'No pending requests'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Quick Action Pending Request Banner if someone paid me */}
          {incomingRequests.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Incoming Payment Confirmations Awaiting Your Verification ({incomingRequests.length})</span>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-semibold underline"
                >
                  View All
                </button>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Confirm whether you received the funds. Only approved payments reduce verified debt balances.
              </p>
            </div>
          )}

          {/* Two-Column Grid: Who I Need to Pay vs Who Needs to Pay Me */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Who I Owe Card List */}
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                    People I Need to Pay
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                    Click any roommate to inspect exact purchase breakdown
                  </p>
                </div>
                <span className="font-mono text-xs text-red-600 dark:text-red-400 font-bold">
                  {formatMoney(pairwise.totalOwedByMe, currencySymbol)}
                </span>
              </div>

              {pairwise.whoIOwe.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    You don't owe any money to roommates!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pairwise.whoIOwe.map((item) => (
                    <div
                      key={item.otherRoommate.id}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-[#23393B] hover:border-neutral-300 dark:hover:border-[#355255] transition-colors flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-[#152426]/50"
                    >
                      <div
                        onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.otherRoommate.color }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            {item.otherRoommate.name}
                          </span>
                          {item.otherRoommate.handle && (
                            <span className="block text-[10px] text-neutral-400 font-mono truncate">
                              {item.otherRoommate.handle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-red-600 dark:text-red-400 tabular-nums">
                            {formatMoney(Math.abs(item.netBalance), currencySymbol)}
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                            className="text-[10px] text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline block"
                          >
                            View Why ({item.items.length} items)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenPaymentRequest(myRoommateId, item.otherRoommate.id, Math.abs(item.netBalance))}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Who Owes Me Card List */}
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                    People Who Owe Me
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                    Roommates who owe you for shared purchases
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatMoney(pairwise.totalOwedToMe, currencySymbol)}
                </span>
              </div>

              {pairwise.whoOwesMe.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-1.5" />
                  <p>No roommates currently owe you money.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pairwise.whoOwesMe.map((item) => (
                    <div
                      key={item.otherRoommate.id}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-[#23393B] hover:border-neutral-300 dark:hover:border-[#355255] transition-colors flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-[#152426]/50"
                    >
                      <div
                        onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.otherRoommate.color }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            {item.otherRoommate.name}
                          </span>
                          {item.otherRoommate.handle && (
                            <span className="block text-[10px] text-neutral-400 font-mono truncate">
                              {item.otherRoommate.handle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatMoney(item.netBalance, currencySymbol)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                          className="text-[10px] text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline block"
                        >
                          View Breakdown
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WHO I OWE TAB */}
      {activeTab === 'who_i_owe' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                Who I Owe ({pairwise.whoIOwe.length})
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                Traceable debt obligations calculated from original shared purchases minus verified repayments
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-neutral-400 uppercase block">Total Owed:</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatMoney(pairwise.totalOwedByMe, currencySymbol)}
              </span>
            </div>
          </div>

          {pairwise.whoIOwe.length === 0 ? (
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-12 text-center text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                Zero Debt Obligations
              </h4>
              <p className="text-neutral-500 mt-1 max-w-sm mx-auto">
                You have completely squared up with all roommates. When a roommate pays for a shared meal or bill, your share will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairwise.whoIOwe.map((item) => (
                <div
                  key={item.otherRoommate.id}
                  className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.otherRoommate.color }}
                      />
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          Owe {item.otherRoommate.name}
                        </div>
                        {item.otherRoommate.handle && (
                          <div className="text-xs text-neutral-400 font-mono">
                            Pay via: {item.otherRoommate.handle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                          {formatMoney(Math.abs(item.netBalance), currencySymbol)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          {item.items.length} shared purchases
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenPaymentRequest(myRoommateId, item.otherRoommate.id, Math.abs(item.netBalance))}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
                      >
                        Submit Payment
                      </button>
                    </div>
                  </div>

                  {/* Quick Summary of Purchases & Breakdown button */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-[#1E3033] flex items-center justify-between text-xs">
                    <span className="text-neutral-500">
                      Original liability: {formatMoney(item.iOweThemGross, currencySymbol)} · Verified repaid: {formatMoney(item.iPaidThemVerified, currencySymbol)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                      className="text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline font-medium"
                    >
                      View Detailed Item Breakdown →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WHO OWES ME TAB */}
      {activeTab === 'who_owes_me' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                Who Owes Me ({pairwise.whoOwesMe.length})
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                Amounts roommates owe you for shared purchases you fronted
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-neutral-400 uppercase block">Total Receivable:</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(pairwise.totalOwedToMe, currencySymbol)}
              </span>
            </div>
          </div>

          {pairwise.whoOwesMe.length === 0 ? (
            <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-12 text-center text-xs">
              <CheckCircle2 className="w-10 h-10 text-neutral-400 mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                No Outstanding Receivables
              </h4>
              <p className="text-neutral-500 mt-1 max-w-sm mx-auto">
                No roommates currently owe you money. When you pay for a shared room expense, other roommates' shares will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairwise.whoOwesMe.map((item) => (
                <div
                  key={item.otherRoommate.id}
                  className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.otherRoommate.color }}
                      />
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.otherRoommate.name} owes you
                        </div>
                        {item.otherRoommate.handle && (
                          <div className="text-xs text-neutral-400 font-mono">
                            Handle: {item.otherRoommate.handle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatMoney(item.netBalance, currencySymbol)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          {item.items.length} shared purchases
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-[#23393B] hover:bg-neutral-50 dark:hover:bg-[#152426] transition-colors"
                      >
                        Inspect Breakdown
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-[#1E3033] flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      Their share of purchases: {formatMoney(item.theyOweMeGross, currencySymbol)} · Repayments received: {formatMoney(item.theyPaidMeVerified, currencySymbol)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBreakdown(item.otherRoommate.id)}
                      className="text-[#0B7A6E] dark:text-[#3FC5B3] hover:underline"
                    >
                      Why they owe you →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENT REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                Payment Verification Workflow
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                Review incoming transfers and monitor submitted payment requests
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenPaymentRequest(myRoommateId, roommates.find((r) => r.id !== myRoommateId)?.id || '')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Submit New Payment
            </button>
          </div>

          {/* Incoming requests (needs my approval) */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
              Transfers Paid to You Awaiting Your Approval ({incomingRequests.length})
            </h4>

            {incomingRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 text-center text-xs text-neutral-400">
                No incoming payments pending your approval.
              </div>
            ) : (
              incomingRequests.map((req) => {
                const sender = roommateMap.get(req.fromRoommate);
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#111D1F] border border-amber-300 dark:border-amber-900/60 rounded-xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            {sender?.name} submitted payment
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold uppercase">
                            Pending Verification
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
                          Date: {req.date} · Channel: {req.method}
                          {req.reference ? ` · Ref: ${req.reference}` : ''}
                        </div>
                        {req.notes && (
                          <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 italic">
                            "{req.notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono font-bold text-base text-neutral-900 dark:text-white tabular-nums">
                          {formatMoney(req.amount, currencySymbol)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onApprovePaymentRequest(req)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectPaymentRequest(req.id, 'Declined by recipient')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Outgoing requests submitted by me */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
              Payments You Submitted ({outgoingRequests.length})
            </h4>

            {outgoingRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 text-center text-xs text-neutral-400">
                You haven't submitted any payment requests yet.
              </div>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map((req) => {
                  const toPerson = roommateMap.get(req.toRoommate);
                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          Paid to {toPerson?.name} via {req.method}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {req.date} {req.reference ? `· Ref: ${req.reference}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold tabular-nums">
                          {formatMoney(req.amount, currencySymbol)}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                              : req.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY EXPENSES TAB */}
      {activeTab === 'my_expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                My Shared Purchases ({myExpenses.length})
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                Purchases paid by you or where you participated in the split
              </p>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">What</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-3">Paid by</th>
                  <th className="py-3 px-3 text-right">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
                {myExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No expenses associated with your profile yet.
                    </td>
                  </tr>
                ) : (
                  myExpenses.map((e) => {
                    const isPayer = e.paidBy === myRoommateId;
                    const payer = roommateMap.get(e.paidBy);
                    const perPerson =
                      e.split.length > 0 ? (e.amount / e.split.length).toFixed(2) : '0';

                    return (
                      <tr key={e.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#162729]">
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{e.date}</td>
                        <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-white">
                          {e.what}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{e.cat}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                          {formatMoney(e.amount, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={isPayer ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                            {isPayer ? 'You' : payer?.name || e.paidBy}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                          {e.split.includes(myRoommateId) ? `${currencySymbol}${perPerson}` : 'Excluded'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
              Notifications & Alerts ({myNotifications.length})
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-mono text-neutral-500">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="space-y-2">
            {myNotifications.length === 0 ? (
              <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-8 text-center text-xs text-neutral-400">
                No notifications right now.
              </div>
            ) : (
              myNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkNotificationAsRead(n.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    n.isRead
                      ? 'border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#111D1F] opacity-75'
                      : 'border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                      {n.title}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {n.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-[#8FA8A5] mt-1">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MY PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
            My Roommate Profile & Payment Credentials
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Configure where other roommates should send payments (Alipay, WeChat Pay, Cash, or UPI) and set your login PIN.
          </p>

          {profileSaved && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Display Name
              </label>
              <input
                type="text"
                disabled
                value={myRoommate.name}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-[#23393B] bg-neutral-100 dark:bg-[#152426] text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Payment Handle (Alipay / WeChat / Bank / Cash)
              </label>
              <input
                type="text"
                defaultValue={myRoommate.handle || ''}
                placeholder="e.g. Alipay: 13800000000, WeChat: myid"
                onChange={(e) => setHandleInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                This appears when roommates click "Pay" to send you money.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Your Current Portal PIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-[#111D1F] border border-neutral-300 dark:border-[#23393B]">
                    {showMyPin ? (myRoommate.pin || 'Not set') : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMyPin(!showMyPin)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title={showMyPin ? 'Hide PIN' : 'Reveal PIN'}
                  >
                    {showMyPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                  Change Access PIN (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Enter new 4-digit PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-[#23393B] bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  You can also ask Room Coordinator (Bilal) to reset or set your PIN if you forget it.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
            >
              Save Profile Settings
            </button>
          </form>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E1B1D]/95 backdrop-blur-md border-t border-neutral-200 dark:border-[#23393B] px-2 py-1.5 flex items-center justify-around text-[10px] font-medium"
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold'
              : 'text-neutral-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('who_i_owe')}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded-lg transition-colors ${
            activeTab === 'who_i_owe'
              ? 'text-red-600 font-bold'
              : 'text-neutral-500'
          }`}
        >
          <ArrowUpRight className="w-5 h-5 mb-0.5 text-red-500" />
          <span>I Owe</span>
        </button>

        <button
          onClick={() => setActiveTab('who_owes_me')}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded-lg transition-colors ${
            activeTab === 'who_owes_me'
              ? 'text-emerald-600 font-bold'
              : 'text-neutral-500'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5 mb-0.5 text-emerald-500" />
          <span>Owes Me</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`relative flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded-lg transition-colors ${
            activeTab === 'requests'
              ? 'text-amber-600 font-bold'
              : 'text-neutral-500'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5 text-amber-500" />
          <span>Requests</span>
          {incomingRequests.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded-lg transition-colors ${
            activeTab === 'profile'
              ? 'text-[#0B7A6E] dark:text-[#3FC5B3] font-bold'
              : 'text-neutral-500'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
