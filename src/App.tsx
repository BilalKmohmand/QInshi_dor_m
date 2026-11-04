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
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_KITTY_DEPOSITS,
  SAMPLE_EXPENSES,
  SAMPLE_PAYMENTS,
  monthOf,
  calculateOutstandingBalances,
  calculateOptionBSettlements,
  calculateKittySummary,
} from './utils/calculator';
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

const STORAGE_KEY = 'hostel_room_tracker_state_v1';
const THEME_KEY = 'hostel_room_theme';


const DEFAULT_SETTINGS: RoomSettings = {
  roomName: 'Hostel Room 304',
  roomNumber: '304',
  currency: 'CNY',
  currencySymbol: '¥',
  monthlyBudget: 1500,
  defaultCoordinator: 'u',
};

export default function App() {
  // Theme state
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

  // Clean out any lingering sample rows from storage on initial load
  useEffect(() => {
    setExpenses((prev) => prev.filter((e) => !e.sample));
    setPayments((prev) => prev.filter((p) => !p.sample));
  }, []);


  // Load initial persistent state without sample rows
  const [roommates, setRoommates] = useState<Roommate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_roommates`);
    return saved ? JSON.parse(saved) : INITIAL_ROOMMATES;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    if (!saved) return INITIAL_EXPENSES;
    try {
      const parsed: Expense[] = JSON.parse(saved);
      return parsed.filter((e) => !e.sample);
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    if (!saved) return INITIAL_PAYMENTS;
    try {
      const parsed: Payment[] = JSON.parse(saved);
      return parsed.filter((p) => !p.sample);
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [kittyDeposits, setKittyDeposits] = useState<KittyDeposit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kitty`);
    return saved ? JSON.parse(saved) : INITIAL_KITTY_DEPOSITS;
  });

  const [settings, setSettings] = useState<RoomSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Save states on change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_roommates`, JSON.stringify(roommates));
  }, [roommates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_kitty`, JSON.stringify(kittyDeposits));
  }, [kittyDeposits]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  // UI Navigation & View State
  const [currentTab, setCurrentTab] = useState<TabKey>('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isHeroCollapsed, setIsHeroCollapsed] = useState<boolean>(false);

  // Viewer / Public Dashboard Mode (Hide other pages when active)
  const [isViewerMode, setIsViewerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'viewer' || params.get('view') === 'dashboard') {
        return true;
      }
    }
    const saved = localStorage.getItem(`${STORAGE_KEY}_viewer_mode`);
    return saved === 'true';
  });

  const toggleViewerMode = () => {
    setIsViewerMode((prev) => {
      const next = !prev;
      localStorage.setItem(`${STORAGE_KEY}_viewer_mode`, String(next));
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

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3500);
  };


  // Compute all available months
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

  // Outstanding balances & settlement counts
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

  // Handlers for Expenses
  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDuplicateExpense = (expense: Expense) => {
    const duplicated: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      what: `${expense.what} (copy)`,
      sample: false,
    };
    setExpenses((prev) => [duplicated, ...prev]);
    showToast(`Duplicated "${expense.what}" to today's ledger.`);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'> | Expense) => {
    if ('id' in expenseData && expenseData.id) {
      // Update
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseData.id ? (expenseData as Expense) : e))
      );
      showToast(`Updated expense "${expenseData.what}".`);
    } else {
      // Create
      const newExp: Expense = {
        ...expenseData,
        id: `exp_${Date.now()}`,
      };
      setExpenses((prev) => [newExp, ...prev]);
      showToast(`Logged purchase "${newExp.what}" for ${settings.currencySymbol}${newExp.amount.toFixed(2)}.`);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense removed from ledger.');
  };

  const handleClearSamples = () => {
    setExpenses((prev) => prev.filter((e) => !e.sample));
    setPayments((prev) => prev.filter((p) => !p.sample));
    showToast('Deleted all sample rows.');
  };

  const handleRestoreSamples = () => {
    setExpenses(SAMPLE_EXPENSES);
    setPayments(SAMPLE_PAYMENTS);
    setRoommates(INITIAL_ROOMMATES);
    showToast('Loaded sample data.');
  };


  // Handlers for Payments
  const handleAddPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay_${Date.now()}`,
    };
    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Recorded repayment of ${settings.currencySymbol}${newPayment.amount.toFixed(2)}.`);
  };

  const handleDeletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    showToast('Payment record deleted.');
  };

  const handleRecordSettlementPayment = (transfer: SettlementTransfer) => {
    const newPayment: Payment = {
      id: `pay_settle_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      note: 'Settlement transfer',
      sample: false,
    };
    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Settlement transfer of ${settings.currencySymbol}${transfer.amount.toFixed(2)} recorded and cleared!`);
  };

  // Handlers for Kitty
  const handleAddKittyDeposit = (depositData: Omit<KittyDeposit, 'id'>) => {
    const newDeposit: KittyDeposit = {
      ...depositData,
      id: `kit_${Date.now()}`,
    };
    setKittyDeposits((prev) => [newDeposit, ...prev]);
    showToast(`Deposited ${settings.currencySymbol}${newDeposit.amount.toFixed(2)} into the room kitty.`);
  };

  const handleDeleteKittyDeposit = (id: string) => {
    setKittyDeposits((prev) => prev.filter((d) => d.id !== id));
    showToast('Kitty deposit removed.');
  };

  // Handlers for Settings & Wipe
  const handleClearAllData = () => {
    setExpenses([]);
    setPayments([]);
    setKittyDeposits([]);
    showToast('All transaction records wiped.');
  };

  const handleImportJsonData = (data: {
    settings: RoomSettings;
    roommates: Roommate[];
    categories: string[];
    expenses: Expense[];
    payments: Payment[];
    kittyDeposits?: KittyDeposit[];
  }) => {
    if (data.settings) setSettings(data.settings);
    if (data.roommates) setRoommates(data.roommates);
    if (data.categories) setCategories(data.categories);
    if (data.expenses) setExpenses(data.expenses);
    if (data.payments) setPayments(data.payments);
    if (data.kittyDeposits) setKittyDeposits(data.kittyDeposits);
    showToast('Backup restored successfully!');
  };

  return (
    <div className="min-h-screen bg-[#EEF2F1] dark:bg-[#0A1213] text-[#0E1B1D] dark:text-[#E6F0EE] transition-colors flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewExpense={handleOpenAddExpense}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isViewerMode={isViewerMode}
        onToggleViewerMode={toggleViewerMode}
      />

      {/* Hero / Editorial Masthead */}
      <HeroMasthead
        settings={settings}
        roommates={roommates}
        totalExpensesCount={expenses.length}
        totalSettlementTransfers={optionBSettlements.length}
        isCollapsed={isHeroCollapsed}
        onToggleCollapse={() => setIsHeroCollapsed(!isHeroCollapsed)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0E1B1D] dark:bg-[#1C2C2F] text-white px-4 py-2.5 rounded-lg shadow-xl border border-neutral-700 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
            {toastMsg}
          </div>
        )}

        {/* If in Viewer Mode: Render ONLY the unified Public Room Dashboard */}
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
          /* Editor Mode: Full Linked Tabs */
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
                  setSettings((prev) => ({ ...prev, defaultCoordinator: id }))
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
                onUpdateSettings={setSettings}
                onUpdateRoommates={setRoommates}
                onUpdateCategories={setCategories}
                onRestoreSampleData={handleRestoreSamples}
                onClearAllData={handleClearAllData}
                onImportJsonData={handleImportJsonData}
              />
            )}
          </>
        )}

        {/* Room Rules & Guide Section */}
        <RulesSection />
      </main>


      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-[#23393B] bg-white dark:bg-[#0E1B1D] py-6 px-4 text-center text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {settings.roomName} (Room {settings.roomNumber}) · Roommates:{' '}
            {roommates.map((r) => r.name).join(', ')}
          </div>
          <div>
            Amounts in {settings.currencySymbol} ({settings.currency}) · All calculations automatic
          </div>
        </div>
      </footer>

      {/* Modal */}
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
