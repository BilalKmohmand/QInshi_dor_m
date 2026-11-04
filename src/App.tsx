import React, { useState, useEffect, useMemo } from 'react';
import {
  Expense,
  Payment,
  Roommate,
  KittyDeposit,
  RoomSettings,
  SettlementTransfer,
} from './types';
import {
  INITIAL_ROOMMATES,
  INITIAL_CATEGORIES,
  SAMPLE_EXPENSES,
  SAMPLE_PAYMENTS,
  monthOf,
  calculateOutstandingBalances,
  calculateOptionBSettlements,
  calculateKittySummary,
} from './utils/calculator';
import {
  loadRoomSnapshot,
  updateRoomSettings,
  syncRoommates,
  syncCategories,
  upsertExpense,
  deleteExpense as apiDeleteExpense,
  insertPayment,
  deletePayment as apiDeletePayment,
  insertKittyDeposit,
  deleteKittyDeposit as apiDeleteKittyDeposit,
  clearTransactions,
  deleteSampleRows,
  replaceRoomLedger,
  newId,
} from './lib/api';
import { Header, TabKey } from './components/Header';
import { HeroMasthead } from './components/HeroMasthead';
import { ExpensesView } from './components/ExpensesView';
import { PaymentsView } from './components/PaymentsView';
import { BalancesView } from './components/BalancesView';
import { SettlementView } from './components/SettlementView';
import { ReportView } from './components/ReportView';
import { KittyView } from './components/KittyView';
import { SettingsView } from './components/SettingsView';
import { ExpenseModal } from './components/ExpenseModal';
import { RulesSection } from './components/RulesSection';
import { ViewerDashboard } from './components/ViewerDashboard';

const THEME_KEY = 'hostel_room_theme';
const VIEWER_KEY = 'hostel_room_viewer_mode';

const DEFAULT_SETTINGS: RoomSettings = {
  roomName: 'Hostel Room 304',
  roomNumber: '304',
  currency: 'CNY',
  currencySymbol: '¥',
  monthlyBudget: 1500,
  defaultCoordinator: '',
};

function remapLegacyId(legacyId: string, roommates: Roommate[]): string {
  if (legacyId === 'KITTY') return 'KITTY';
  const idx = INITIAL_ROOMMATES.findIndex((r) => r.id === legacyId);
  if (idx >= 0 && roommates[idx]) return roommates[idx].id;
  const byName = roommates.find(
    (r) => r.name.toLowerCase() === INITIAL_ROOMMATES.find((x) => x.id === legacyId)?.name.toLowerCase()
  );
  return byName?.id || roommates[0]?.id || legacyId;
}

function remapSampleExpenses(roommates: Roommate[]): Expense[] {
  return SAMPLE_EXPENSES.map((e) => ({
    ...e,
    id: newId(),
    paidBy: remapLegacyId(e.paidBy, roommates),
    split: e.split.map((id) => remapLegacyId(id, roommates)),
    sample: false,
  }));
}

function remapSamplePayments(roommates: Roommate[]): Payment[] {
  return SAMPLE_PAYMENTS.map((p) => ({
    ...p,
    id: newId(),
    from: remapLegacyId(p.from, roommates),
    to: remapLegacyId(p.to, roommates),
    sample: false,
  }));
}

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kittyDeposits, setKittyDeposits] = useState<KittyDeposit[]>([]);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);

  const [currentTab, setCurrentTab] = useState<TabKey>('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isHeroCollapsed, setIsHeroCollapsed] = useState<boolean>(false);

  const [isViewerMode, setIsViewerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'viewer' || params.get('view') === 'dashboard') {
        return true;
      }
    }
    return localStorage.getItem(VIEWER_KEY) === 'true';
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const withErrorToast = async (action: () => Promise<void>, fallback: string) => {
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : fallback;
      showToast(message);
      throw err;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await loadRoomSnapshot();
        if (cancelled) return;
        setRoomId(snap.roomId);
        setSettings(snap.settings);
        setRoommates(snap.roommates);
        setCategories(snap.categories.length ? snap.categories : INITIAL_CATEGORIES);
        setExpenses(snap.expenses);
        setPayments(snap.payments);
        setKittyDeposits(snap.kittyDeposits);
        setBootError(null);
      } catch (err) {
        if (cancelled) return;
        setBootError(err instanceof Error ? err.message : 'Failed to load room data from Supabase.');
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleViewerMode = () => {
    setIsViewerMode((prev) => {
      const next = !prev;
      localStorage.setItem(VIEWER_KEY, String(next));
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set('mode', 'viewer');
        } else {
          url.searchParams.delete('mode');
          url.searchParams.delete('view');
        }
        window.history.replaceState({}, '', url.toString());
      }
      showToast(next ? 'Switched to Public View-Only Dashboard.' : 'Roommate Mode: Editing unlocked.');
      return next;
    });
  };

  const allMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const m = monthOf(e.date);
      if (m) set.add(m);
    });
    payments.forEach((p) => {
      const m = monthOf(p.date);
      if (m) set.add(m);
    });
    return Array.from(set).sort().reverse();
  }, [expenses, payments]);

  const outstanding = useMemo(
    () => calculateOutstandingBalances(expenses, payments, roommates),
    [expenses, payments, roommates]
  );

  const optionBSettlements = useMemo(
    () => calculateOptionBSettlements(outstanding),
    [outstanding]
  );

  const kittySummary = useMemo(
    () => calculateKittySummary(kittyDeposits, expenses),
    [kittyDeposits, expenses]
  );

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDuplicateExpense = async (expense: Expense) => {
    if (!roomId) return;
    const duplicated: Expense = {
      ...expense,
      id: newId(),
      date: new Date().toISOString().slice(0, 10),
      what: `${expense.what} (copy)`,
      sample: false,
    };
    try {
      await withErrorToast(() => upsertExpense(roomId, duplicated), 'Failed to duplicate expense.');
      setExpenses((prev) => [duplicated, ...prev]);
      showToast(`Duplicated "${expense.what}" to today's ledger.`);
    } catch {
      /* toasted */
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'> | Expense) => {
    if (!roomId) return;
    if ('id' in expenseData && expenseData.id) {
      const updated = expenseData as Expense;
      try {
        await withErrorToast(() => upsertExpense(roomId, updated), 'Failed to update expense.');
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showToast(`Updated expense "${updated.what}".`);
      } catch {
        /* toasted */
      }
    } else {
      const newExp: Expense = { ...expenseData, id: newId() };
      try {
        await withErrorToast(() => upsertExpense(roomId, newExp), 'Failed to save expense.');
        setExpenses((prev) => [newExp, ...prev]);
        showToast(
          `Logged purchase "${newExp.what}" for ${settings.currencySymbol}${newExp.amount.toFixed(2)}.`
        );
      } catch {
        /* toasted */
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!roomId) return;
    try {
      await withErrorToast(() => apiDeleteExpense(id), 'Failed to delete expense.');
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast('Expense removed from ledger.');
    } catch {
      /* toasted */
    }
  };

  const handleClearSamples = async () => {
    if (!roomId) return;
    try {
      await withErrorToast(() => deleteSampleRows(roomId), 'Failed to clear samples.');
      setExpenses((prev) => prev.filter((e) => !e.sample));
      setPayments((prev) => prev.filter((p) => !p.sample));
      showToast('Deleted all sample rows.');
    } catch {
      /* toasted */
    }
  };

  const handleRestoreSamples = async () => {
    if (!roomId) return;
    const nextRoommates = roommates.length ? roommates : INITIAL_ROOMMATES.map((r) => ({ ...r, id: newId() }));
    const sampleExpenses = remapSampleExpenses(nextRoommates);
    const samplePayments = remapSamplePayments(nextRoommates);
    try {
      await withErrorToast(
        () =>
          replaceRoomLedger(roomId, {
            settings: {
              ...settings,
              defaultCoordinator: nextRoommates[0]?.id || settings.defaultCoordinator,
            },
            roommates: nextRoommates,
            categories: categories.length ? categories : INITIAL_CATEGORIES,
            expenses: sampleExpenses,
            payments: samplePayments,
            kittyDeposits: [],
          }),
        'Failed to load sample data.'
      );
      setRoommates(nextRoommates);
      setExpenses(sampleExpenses);
      setPayments(samplePayments);
      setKittyDeposits([]);
      showToast('Loaded sample data.');
    } catch {
      /* toasted */
    }
  };

  const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
    if (!roomId) return;
    const newPayment: Payment = { ...paymentData, id: newId() };
    try {
      await withErrorToast(() => insertPayment(roomId, newPayment), 'Failed to save payment.');
      setPayments((prev) => [newPayment, ...prev]);
      showToast(
        `Recorded repayment of ${settings.currencySymbol}${newPayment.amount.toFixed(2)}.`
      );
    } catch {
      /* toasted */
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!roomId) return;
    try {
      await withErrorToast(() => apiDeletePayment(id), 'Failed to delete payment.');
      setPayments((prev) => prev.filter((p) => p.id !== id));
      showToast('Payment record deleted.');
    } catch {
      /* toasted */
    }
  };

  const handleRecordSettlementPayment = async (transfer: SettlementTransfer) => {
    if (!roomId) return;
    const newPayment: Payment = {
      id: newId(),
      date: new Date().toISOString().slice(0, 10),
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      note: 'Settlement transfer',
      sample: false,
    };
    try {
      await withErrorToast(() => insertPayment(roomId, newPayment), 'Failed to record settlement.');
      setPayments((prev) => [newPayment, ...prev]);
      showToast(
        `Settlement transfer of ${settings.currencySymbol}${transfer.amount.toFixed(2)} recorded and cleared!`
      );
    } catch {
      /* toasted */
    }
  };

  const handleAddKittyDeposit = async (depositData: Omit<KittyDeposit, 'id'>) => {
    if (!roomId) return;
    const newDeposit: KittyDeposit = { ...depositData, id: newId() };
    try {
      await withErrorToast(() => insertKittyDeposit(roomId, newDeposit), 'Failed to save deposit.');
      setKittyDeposits((prev) => [newDeposit, ...prev]);
      showToast(
        `Deposited ${settings.currencySymbol}${newDeposit.amount.toFixed(2)} into the room kitty.`
      );
    } catch {
      /* toasted */
    }
  };

  const handleDeleteKittyDeposit = async (id: string) => {
    if (!roomId) return;
    try {
      await withErrorToast(() => apiDeleteKittyDeposit(id), 'Failed to delete deposit.');
      setKittyDeposits((prev) => prev.filter((d) => d.id !== id));
      showToast('Kitty deposit removed.');
    } catch {
      /* toasted */
    }
  };

  const handleUpdateSettings = async (next: RoomSettings) => {
    if (!roomId) return;
    setSettings(next);
    try {
      await withErrorToast(() => updateRoomSettings(roomId, next), 'Failed to save settings.');
    } catch {
      /* toasted */
    }
  };

  const handleUpdateRoommates = async (next: Roommate[]) => {
    if (!roomId) return;
    setRoommates(next);
    try {
      await withErrorToast(() => syncRoommates(roomId, next), 'Failed to sync roommates.');
    } catch {
      /* toasted */
    }
  };

  const handleUpdateCategories = async (next: string[]) => {
    if (!roomId) return;
    setCategories(next);
    try {
      await withErrorToast(() => syncCategories(roomId, next), 'Failed to sync categories.');
    } catch {
      /* toasted */
    }
  };

  const handleClearAllData = async () => {
    if (!roomId) return;
    try {
      await withErrorToast(() => clearTransactions(roomId), 'Failed to wipe ledger.');
      setExpenses([]);
      setPayments([]);
      setKittyDeposits([]);
      showToast('All transaction records wiped.');
    } catch {
      /* toasted */
    }
  };

  const handleImportJsonData = async (data: {
    settings: RoomSettings;
    roommates: Roommate[];
    categories: string[];
    expenses: Expense[];
    payments: Payment[];
    kittyDeposits?: KittyDeposit[];
  }) => {
    if (!roomId) return;
    const payload = {
      settings: data.settings,
      roommates: data.roommates,
      categories: data.categories,
      expenses: (data.expenses || []).map((e) => ({ ...e, id: e.id || newId(), sample: false })),
      payments: (data.payments || []).map((p) => ({ ...p, id: p.id || newId(), sample: false })),
      kittyDeposits: (data.kittyDeposits || []).map((d) => ({ ...d, id: d.id || newId() })),
    };
    try {
      await withErrorToast(() => replaceRoomLedger(roomId, payload), 'Failed to import backup.');
      setSettings(payload.settings);
      setRoommates(payload.roommates);
      setCategories(payload.categories);
      setExpenses(payload.expenses);
      setPayments(payload.payments);
      setKittyDeposits(payload.kittyDeposits);
      showToast('Backup restored successfully!');
    } catch {
      /* toasted */
    }
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F1] dark:bg-[#0A1213] text-sm text-neutral-600 dark:text-neutral-300">
        Loading room ledger from Supabase…
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F1] dark:bg-[#0A1213] px-6">
        <div className="max-w-lg w-full rounded-xl border border-red-200 bg-white dark:bg-[#111D1F] dark:border-red-900 p-6 space-y-3">
          <h1 className="text-base font-bold text-red-700 dark:text-red-300">Supabase connection error</h1>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{bootError}</p>
          <p className="text-xs text-neutral-500">
            Confirm <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, that the
            schema seed ran, and that you applied <code>supabase/rls.sql</code> if RLS is blocking.
          </p>
          <button
            type="button"
            className="text-xs px-3 py-2 rounded-lg bg-[#0B7A6E] text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F1] dark:bg-[#0A1213] text-[#0E1B1D] dark:text-[#E6F0EE] transition-colors flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewExpense={handleOpenAddExpense}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isViewerMode={isViewerMode}
        onToggleViewerMode={toggleViewerMode}
      />

      <HeroMasthead
        settings={settings}
        roommates={roommates}
        totalExpensesCount={expenses.length}
        totalSettlementTransfers={optionBSettlements.length}
        isCollapsed={isHeroCollapsed}
        onToggleCollapse={() => setIsHeroCollapsed(!isHeroCollapsed)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0E1B1D] dark:bg-[#1C2C2F] text-white px-4 py-2.5 rounded-lg shadow-xl border border-neutral-700 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
            {toastMsg}
          </div>
        )}

        {isViewerMode ? (
          <ViewerDashboard
            expenses={expenses}
            payments={payments}
            roommates={roommates}
            categories={categories}
            settings={settings}
            kittyDeposits={kittyDeposits}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            allMonths={allMonths}
            onSwitchToEditor={toggleViewerMode}
          />
        ) : (
          <>
            {currentTab === 'expenses' && (
              <ExpensesView
                expenses={expenses}
                roommates={roommates}
                categories={categories}
                currencySymbol={settings.currencySymbol}
                onAddExpense={handleOpenAddExpense}
                onEditExpense={handleEditExpense}
                onDuplicateExpense={handleDuplicateExpense}
                onDeleteExpense={handleDeleteExpense}
                onClearSamples={handleClearSamples}
                onRestoreSamples={handleRestoreSamples}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                allMonths={allMonths}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentsView
                payments={payments}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
                onAddPayment={handleAddPayment}
                onDeletePayment={handleDeletePayment}
              />
            )}

            {currentTab === 'balances' && (
              <BalancesView
                expenses={expenses}
                payments={payments}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                allMonths={allMonths}
              />
            )}

            {currentTab === 'settlement' && (
              <SettlementView
                expenses={expenses}
                payments={payments}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
                roomName={settings.roomName}
                coordinatorId={settings.defaultCoordinator}
                onSelectCoordinator={(id) =>
                  handleUpdateSettings({ ...settings, defaultCoordinator: id })
                }
                onRecordSettlementPayment={handleRecordSettlementPayment}
              />
            )}

            {currentTab === 'report' && (
              <ReportView
                expenses={expenses}
                roommates={roommates}
                categories={categories}
                currencySymbol={settings.currencySymbol}
                monthlyBudget={settings.monthlyBudget}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                allMonths={allMonths}
              />
            )}

            {currentTab === 'kitty' && (
              <KittyView
                deposits={kittyDeposits}
                expenses={expenses}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
                onAddDeposit={handleAddKittyDeposit}
                onDeleteDeposit={handleDeleteKittyDeposit}
                onLogKittyExpense={handleOpenAddExpense}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                roommates={roommates}
                categories={categories}
                expenses={expenses}
                payments={payments}
                kittyDeposits={kittyDeposits}
                onUpdateSettings={handleUpdateSettings}
                onUpdateRoommates={handleUpdateRoommates}
                onUpdateCategories={handleUpdateCategories}
                onRestoreSampleData={handleRestoreSamples}
                onClearAllData={handleClearAllData}
                onImportJsonData={handleImportJsonData}
              />
            )}
          </>
        )}

        <RulesSection />
      </main>

      <footer className="border-t border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#0E1B1D] py-6 px-4 text-center text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {settings.roomName} (Room {settings.roomNumber}) · Roommates:{' '}
            {roommates.map((r) => r.name).join(', ')}
          </div>
          <div>
            Amounts in {settings.currencySymbol} ({settings.currency}) · Synced with Supabase
          </div>
        </div>
      </footer>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        roommates={roommates}
        categories={categories}
        currencySymbol={settings.currencySymbol}
        hasKitty={kittyDeposits.length > 0}
        kittyBalance={kittySummary.remaining}
      />
    </div>
  );
}
