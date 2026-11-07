import React, { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import {
  Expense,
  Payment,
  Roommate,
  KittyDeposit,
  RoomSettings,
  SettlementTransfer,
  PaymentRequest,
  AppNotification,
  AuditLog,
  UserSession,
} from './types';
import {
  INITIAL_ROOMMATES,
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_KITTY_DEPOSITS,
  monthOf,
  calculateOutstandingBalances,
  calculateOptionBSettlements,
  calculateKittySummary,
  calculateTotalPendingSettlementAmount,
} from './utils/calculator';
import {
  fetchCompleteRoomData,
  saveExpenseToSupabase,
  deleteExpenseFromSupabase,
  savePaymentToSupabase,
  deletePaymentFromSupabase,
  saveKittyDepositToSupabase,
  deleteKittyDepositFromSupabase,
  updateRoomSettingsInSupabase,
  updateRoommatesInSupabase,
  savePaymentRequestToSupabase,
  saveNotificationToSupabase,
  markNotificationReadInSupabase,
  saveAuditLogToSupabase,
  DEFAULT_ROOM_ID,
  newId,
  supabase,
} from './utils/supabaseClient';
import { Header, TabKey } from './components/Header';
import { HeroMasthead } from './components/HeroMasthead';
import { ExpensesView } from './components/ExpensesView';
import { PaymentsView } from './components/PaymentsView';
import { BalancesView } from './components/BalancesView';
import { SettlementView } from './components/SettlementView';
import { ReportView } from './components/ReportView';
import { KittyView } from './components/KittyView';
import { SettingsView } from './components/SettingsView';
import { RoommatesView } from './components/RoommatesView';
import { AdminPaymentRequestsView } from './components/AdminPaymentRequestsView';
import { AuditLogView } from './components/AuditLogView';
import { ExpenseModal } from './components/ExpenseModal';
import { DebtBreakdownModal } from './components/DebtBreakdownModal';
import { PaymentRequestModal } from './components/PaymentRequestModal';
import { AuthModal } from './components/AuthModal';
import { RulesSection } from './components/RulesSection';
import { ViewerDashboard } from './components/ViewerDashboard';
import { RoommateDashboard } from './components/RoommateDashboard';

const STORAGE_KEY = 'hostel_room_tracker_state_v2';
const THEME_KEY = 'hostel_room_theme';
const SESSION_KEY = 'hostel_room_user_session';
const REQUESTS_KEY = 'hostel_payment_requests_v2';
const NOTIFICATIONS_KEY = 'hostel_notifications_v2';
const AUDIT_LOGS_KEY = 'hostel_audit_logs_v2';

const DEFAULT_SETTINGS: RoomSettings = {
  id: DEFAULT_ROOM_ID,
  roomName: 'Hostel Room 304',
  roomNumber: '304',
  currency: 'CNY',
  currencySymbol: '¥',
  monthlyBudget: 1500,
  defaultCoordinator: 'c82701e8-7e77-4b6d-a764-7b6dfec20786', // Bilal's ID
  adminPin: undefined,
};

const PINS_KEY = 'hostel_room_pins_v1';

function loadPinMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePinMap(map: Record<string, string>) {
  localStorage.setItem(PINS_KEY, JSON.stringify(map));
}

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

  // Loading state for Supabase
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Core Data States
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
    if (!saved) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(saved) as RoomSettings;
      // Drop legacy shared placeholder admin PIN
      if (parsed.adminPin === '7575' || parsed.adminPin === '1234') {
        parsed.adminPin = undefined;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // One-time scrub of legacy shared placeholder roommate PINs
  useEffect(() => {
    const map = loadPinMap();
    let changed = false;
    Object.keys(map).forEach((id) => {
      if (map[id] === '1234' || map[id] === '7575') {
        delete map[id];
        changed = true;
      }
    });
    if (changed) savePinMap(map);
    setRoommates((prev) =>
      prev.map((r) =>
        r.pin === '1234' || r.pin === '7575' ? { ...r, pin: undefined } : r
      )
    );
  }, []);

  // User Session State
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceMode = urlParams?.get('mode');

    if (forceMode === 'viewer') {
      return {
        isLoggedIn: false,
        role: 'viewer',
        roommateId: null,
        roommateName: null,
        email: null,
      };
    }

    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }

    // Default to Viewer mode if no session is stored (so visitors only see the public dashboard)
    return {
      isLoggedIn: false,
      role: 'viewer',
      roommateId: null,
      roommateName: null,
      email: null,
    };
  });

  // Payment Requests State
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem(REQUESTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(AUDIT_LOGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

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

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  // Fetch real data from live Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoadingSupabase(true);
        const data = await fetchCompleteRoomData(DEFAULT_ROOM_ID);
        if (!isMounted) return;

        const pinMap = loadPinMap();
        startTransition(() => {
          if (data.roommates && data.roommates.length > 0) {
            setRoommates(
              data.roommates.map((r) => ({
                ...r,
                pin: pinMap[r.id] || r.pin,
              }))
            );
          }
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.expenses) {
            setExpenses(data.expenses.filter((e) => !e.sample));
          }
          if (data.payments) {
            setPayments(data.payments.filter((p) => !p.sample));
          }
          if (data.kittyDeposits) {
            setKittyDeposits(data.kittyDeposits);
          }
          if (data.settings) {
            setSettings((prev) => ({
              ...data.settings,
              adminPin: prev.adminPin || data.settings.adminPin,
            }));
          }
          if (data.paymentRequests) setPaymentRequests(data.paymentRequests);
          if (data.notifications) setNotifications(data.notifications);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
          setSupabaseConnected(true);
        });
      } catch (err) {
        console.warn('Could not sync with Supabase, using cached records:', err);
        setSupabaseConnected(false);
      } finally {
        if (isMounted) setIsLoadingSupabase(false);
      }
    }

    loadData();

    // Check if Supabase has an active auth session
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user && isMounted) {
        const email = data.session.user.email || '';
        const isBilal = email.toLowerCase().includes('bilal') || email.toLowerCase().includes('admin');
        const matched = roommates.find((r) => email.toLowerCase().includes(r.name.toLowerCase()));

        setUserSession((prev) => {
          if (prev.isLoggedIn) return prev;
          return {
            isLoggedIn: true,
            role: isBilal ? 'admin' : 'roommate',
            roommateId: matched ? matched.id : isBilal ? settings.defaultCoordinator : roommates[0]?.id || null,
            roommateName: matched ? matched.name : isBilal ? 'Bilal (Coordinator)' : 'Roommate',
            email,
          };
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // UI Navigation & View State
  const [currentTab, setCurrentTab] = useState<TabKey>('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isHeroCollapsed, setIsHeroCollapsed] = useState<boolean>(false);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [breakdownOtherId, setBreakdownOtherId] = useState<string | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  const [isPaymentRequestModalOpen, setIsPaymentRequestModalOpen] = useState(false);
  const [requestInitialFromId, setRequestInitialFromId] = useState<string | undefined>();
  const [requestInitialToId, setRequestInitialToId] = useState<string | undefined>();
  const [requestInitialAmount, setRequestInitialAmount] = useState<number | undefined>();

  // Months computation
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

  // Outstanding balances & settlement
  const outstanding = useMemo(
    () => calculateOutstandingBalances(expenses, payments, roommates),
    [expenses, payments, roommates]
  );

  const optionBSettlements = useMemo(
    () => calculateOptionBSettlements(outstanding),
    [outstanding]
  );

  const totalSettlementAmount = useMemo(
    () => calculateTotalPendingSettlementAmount(optionBSettlements),
    [optionBSettlements]
  );

  const kittySummary = useMemo(
    () => calculateKittySummary(kittyDeposits, expenses),
    [kittyDeposits, expenses]
  );

  // Unread notifications & pending requests count
  const unreadCount = useMemo(() => {
    if (!userSession.roommateId) return 0;
    return notifications.filter(
      (n) => (n.recipientId === userSession.roommateId || n.recipientId === 'ALL') && !n.isRead
    ).length;
  }, [notifications, userSession.roommateId]);

  const pendingRequestsCount = useMemo(() => {
    return paymentRequests.filter((r) => r.status === 'pending').length;
  }, [paymentRequests]);

  // Helper to append audit log
  const logAudit = useCallback((
    action: string,
    entityType: AuditLog['entityType'],
    details: string,
    amount?: number,
    entityId?: string
  ) => {
    const newLog: AuditLog = {
      id: newId(),
      actorId: userSession.roommateId || 'coordinator',
      actorName: userSession.roommateName || 'Coordinator',
      action,
      entityType,
      entityId,
      amount,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveAuditLogToSupabase(DEFAULT_ROOM_ID, newLog).catch(console.error);
  }, [userSession]);

  // Helper to send notification
  const sendNotification = useCallback((
    recipientId: string,
    title: string,
    message: string,
    type: AppNotification['type'],
    relatedId?: string
  ) => {
    const newNotif: AppNotification = {
      id: newId(),
      recipientId,
      title,
      message,
      type,
      isRead: false,
      relatedId,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToSupabase(DEFAULT_ROOM_ID, newNotif).catch(console.error);
  }, []);

  // Handlers for Expenses
  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDuplicateExpense = async (expense: Expense) => {
    const duplicated: Expense = {
      ...expense,
      id: newId(),
      date: new Date().toISOString().slice(0, 10),
      what: `${expense.what} (copy)`,
      sample: false,
    };
    setExpenses((prev) => [duplicated, ...prev]);
    showToast(`Duplicated "${expense.what}" to today's ledger.`);
    logAudit('Duplicated expense', 'expense', `Duplicated "${expense.what}"`, duplicated.amount, duplicated.id);

    try {
      await saveExpenseToSupabase(DEFAULT_ROOM_ID, duplicated);
    } catch (err) {
      console.error('Supabase write error:', err);
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'> | Expense) => {
    if ('id' in expenseData && expenseData.id) {
      // Update
      const updated = expenseData as Expense;
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showToast(`Updated expense "${updated.what}".`);
      logAudit('Updated expense', 'expense', `Updated "${updated.what}"`, updated.amount, updated.id);

      try {
        await saveExpenseToSupabase(DEFAULT_ROOM_ID, updated);
      } catch (err) {
        console.error('Supabase write error:', err);
      }
    } else {
      // Create
      const newExp: Expense = {
        ...expenseData,
        id: newId(),
      };
      setExpenses((prev) => [newExp, ...prev]);
      showToast(`Logged purchase "${newExp.what}" for ${settings.currencySymbol}${newExp.amount.toFixed(2)}.`);
      logAudit('Added expense', 'expense', `Added "${newExp.what}" paid by ${newExp.paidBy}`, newExp.amount, newExp.id);

      // Notify roommates in split
      newExp.split.forEach((rmId) => {
        if (rmId !== newExp.paidBy) {
          sendNotification(
            rmId,
            'New Shared Expense',
            `${newExp.what} logged for ${settings.currencySymbol}${newExp.amount.toFixed(2)}. Your share has been allocated.`,
            'expense_added',
            newExp.id
          );
        }
      });

      try {
        await saveExpenseToSupabase(DEFAULT_ROOM_ID, newExp);
      } catch (err) {
        console.error('Supabase write error:', err);
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense removed from ledger.');
    if (exp) {
      logAudit('Deleted expense', 'expense', `Removed "${exp.what}"`, exp.amount, id);
    }

    try {
      await deleteExpenseFromSupabase(id);
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
  };

  // Handlers for Payments
  const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: newId(),
    };
    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Recorded repayment of ${settings.currencySymbol}${newPayment.amount.toFixed(2)}.`);
    logAudit('Added payment', 'payment', `Recorded repayment from ${newPayment.from} to ${newPayment.to}`, newPayment.amount, newPayment.id);

    try {
      await savePaymentToSupabase(DEFAULT_ROOM_ID, newPayment);
    } catch (err) {
      console.error('Supabase save payment error:', err);
    }
  };

  const handleDeletePayment = async (id: string) => {
    const pay = payments.find((p) => p.id === id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
    showToast('Payment record deleted.');
    if (pay) {
      logAudit('Deleted payment', 'payment', `Deleted payment record`, pay.amount, id);
    }

    try {
      await deletePaymentFromSupabase(id);
    } catch (err) {
      console.error('Supabase delete payment error:', err);
    }
  };

  const handleRecordSettlementPayment = async (transfer: SettlementTransfer) => {
    const newPayment: Payment = {
      id: newId(),
      date: new Date().toISOString().slice(0, 10),
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      note: 'Settlement transfer',
      sample: false,
    };
    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Settlement transfer of ${settings.currencySymbol}${transfer.amount.toFixed(2)} recorded and cleared!`);
    logAudit('Settlement executed', 'payment', `Settlement payment completed`, transfer.amount, newPayment.id);

    try {
      await savePaymentToSupabase(DEFAULT_ROOM_ID, newPayment);
    } catch (err) {
      console.error('Supabase save payment error:', err);
    }
  };

  // Handlers for Kitty
  const handleAddKittyDeposit = async (depositData: Omit<KittyDeposit, 'id'>) => {
    const newDeposit: KittyDeposit = {
      ...depositData,
      id: newId(),
    };
    setKittyDeposits((prev) => [newDeposit, ...prev]);
    showToast(`Deposited ${settings.currencySymbol}${newDeposit.amount.toFixed(2)} into the room kitty.`);
    logAudit('Added kitty deposit', 'kitty', `Deposit by ${depositData.roommateId}`, depositData.amount, newDeposit.id);

    try {
      await saveKittyDepositToSupabase(DEFAULT_ROOM_ID, newDeposit);
    } catch (err) {
      console.error('Supabase save kitty error:', err);
    }
  };

  const handleDeleteKittyDeposit = async (id: string) => {
    setKittyDeposits((prev) => prev.filter((d) => d.id !== id));
    showToast('Kitty deposit removed.');
    logAudit('Deleted kitty deposit', 'kitty', `Removed deposit ${id}`);

    try {
      await deleteKittyDepositFromSupabase(id);
    } catch (err) {
      console.error('Supabase delete kitty error:', err);
    }
  };

  // Payment Requests Workflow
  const handleOpenPaymentRequestModal = (fromId?: string, toId?: string, amount?: number) => {
    setRequestInitialFromId(fromId || userSession.roommateId || roommates[0]?.id);
    setRequestInitialToId(toId || roommates.find((r) => r.id !== fromId)?.id || roommates[1]?.id);
    setRequestInitialAmount(amount);
    setIsPaymentRequestModalOpen(true);
  };

  const handleSubmitPaymentRequest = (data: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: PaymentRequest = {
      ...data,
      id: newId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setPaymentRequests((prev) => [newRequest, ...prev]);
    showToast(`Payment request of ${settings.currencySymbol}${newRequest.amount.toFixed(2)} submitted for verification.`);
    logAudit('Submitted payment request', 'payment_request', `Transfer sent via ${newRequest.method}`, newRequest.amount, newRequest.id);
    savePaymentRequestToSupabase(DEFAULT_ROOM_ID, newRequest).catch(console.error);

    // Notify recipient
    sendNotification(
      newRequest.toRoommate,
      'Payment Confirmation Received',
      `${roommates.find((r) => r.id === newRequest.fromRoommate)?.name} sent ${settings.currencySymbol}${newRequest.amount.toFixed(2)} via ${newRequest.method}. Please verify and approve.`,
      'payment_submitted',
      newRequest.id
    );
  };

  const handleApprovePaymentRequest = async (request: PaymentRequest) => {
    const reviewedBy = userSession.roommateId || settings.defaultCoordinator || null;
    const reviewedAt = new Date().toISOString();
    const approved: PaymentRequest = {
      ...request,
      status: 'approved',
      reviewedBy: reviewedBy || undefined,
      reviewedAt,
    };

    setPaymentRequests((prev) => prev.map((r) => (r.id === request.id ? approved : r)));

    const newPayment: Payment = {
      id: newId(),
      date: request.date,
      from: request.fromRoommate,
      to: request.toRoommate,
      amount: request.amount,
      note: request.notes ? `${request.method}: ${request.notes}` : `Paid via ${request.method}`,
      method: request.method,
      reference: request.reference,
      requestId: request.id,
      sample: false,
    };

    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Approved! Payment of ${settings.currencySymbol}${request.amount.toFixed(2)} verified and balances updated.`);
    logAudit('Approved payment request', 'payment_request', `Verified payment from ${request.fromRoommate} to ${request.toRoommate}`, request.amount, request.id);

    sendNotification(
      request.fromRoommate,
      'Payment Approved!',
      `Your payment of ${settings.currencySymbol}${request.amount.toFixed(2)} to ${roommates.find((r) => r.id === request.toRoommate)?.name} has been verified!`,
      'payment_approved',
      request.id
    );

    try {
      await Promise.all([
        savePaymentRequestToSupabase(DEFAULT_ROOM_ID, approved),
        savePaymentToSupabase(DEFAULT_ROOM_ID, newPayment),
      ]);
    } catch (err) {
      console.error('Supabase write verified payment error:', err);
    }
  };

  const handleRejectPaymentRequest = (requestId: string, reason = 'Declined by recipient') => {
    const target = paymentRequests.find((r) => r.id === requestId);
    const reviewedBy = userSession.roommateId || settings.defaultCoordinator || undefined;
    const reviewedAt = new Date().toISOString();
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              reviewedBy,
              reviewedAt,
              rejectionReason: reason,
            }
          : r
      )
    );

    showToast('Payment request rejected.');
    if (target) {
      const rejected: PaymentRequest = {
        ...target,
        status: 'rejected',
        reviewedBy,
        reviewedAt,
        rejectionReason: reason,
      };
      savePaymentRequestToSupabase(DEFAULT_ROOM_ID, rejected).catch(console.error);
      logAudit('Rejected payment request', 'payment_request', `Rejected payment of ${target.amount}. Reason: ${reason}`, target.amount, requestId);
      sendNotification(
        target.fromRoommate,
        'Payment Request Rejected',
        `Your payment request of ${settings.currencySymbol}${target.amount.toFixed(2)} was not approved. Reason: ${reason}`,
        'payment_rejected',
        requestId
      );
    }
  };

  // Detailed Debt Breakdown Modal opener
  const handleOpenBreakdown = (otherId: string) => {
    setBreakdownOtherId(otherId);
    setIsBreakdownModalOpen(true);
  };

  // Authentication Handlers
  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    showToast(`Welcome back, ${session.roommateName}!`);
    logAudit('User login', 'roommate', `Logged in as ${session.roommateName} (${session.role})`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUserSession({
      isLoggedIn: false,
      role: 'viewer',
      roommateId: null,
      roommateName: null,
      email: null,
    });
    showToast('Logged out. Switched to public view-only dashboard.');
  };

  const handleSwitchToViewer = () => {
    setUserSession({
      isLoggedIn: false,
      role: 'viewer',
      roommateId: null,
      roommateName: null,
      email: null,
    });
    showToast('Public Room Dashboard active.');
  };

  // Profile update from roommate portal
  const handleUpdateMyProfile = (handle: string, pin?: string) => {
    if (!userSession.roommateId) return;
    const nextPin = pin?.trim();
    if (nextPin) {
      const map = loadPinMap();
      map[userSession.roommateId] = nextPin;
      savePinMap(map);
    }
    setRoommates((prev) =>
      prev.map((r) =>
        r.id === userSession.roommateId
          ? {
              ...r,
              handle: handle || r.handle,
              pin: nextPin || r.pin,
            }
          : r
      )
    );
    showToast('Profile updated.');
    logAudit('Updated profile', 'roommate', `Updated profile for ${userSession.roommateName}`);
    const nextRoommates = roommates.map((r) =>
      r.id === userSession.roommateId
        ? { ...r, handle: handle || r.handle, pin: nextPin || r.pin }
        : r
    );
    updateRoommatesInSupabase(DEFAULT_ROOM_ID, nextRoommates).catch(console.error);
  };

  const handleSetAdminPin = (pin: string) => {
    setSettings((prev) => {
      const next = { ...prev, adminPin: pin };
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(next));
      return next;
    });
    showToast('Admin PIN saved. Keep it private.');
  };

  const syncRoommatePins = (next: Roommate[]) => {
    const map = loadPinMap();
    next.forEach((r) => {
      if (r.pin?.trim()) map[r.id] = r.pin.trim();
      else delete map[r.id];
    });
    savePinMap(map);
  };

  // Update Settings & Roommates from views
  const handleUpdateSettings = async (newSettings: RoomSettings) => {
    setSettings(newSettings);
    showToast('Settings saved.');
    logAudit('Updated settings', 'settings', `Updated room settings`);
    try {
      await updateRoomSettingsInSupabase(DEFAULT_ROOM_ID, newSettings);
    } catch (err) {
      console.error('Supabase update settings error:', err);
    }
  };

  const handleUpdateRoommates = async (newRoommates: Roommate[]) => {
    syncRoommatePins(newRoommates);
    setRoommates(newRoommates);
    showToast('Roommates roster updated.');
    logAudit('Updated roommates', 'roommate', `Roster now contains ${newRoommates.length} members`);
    try {
      await updateRoommatesInSupabase(DEFAULT_ROOM_ID, newRoommates);
    } catch (err) {
      console.error('Supabase update roommates error:', err);
    }
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    markNotificationReadInSupabase(notifId).catch(console.error);
  };

  return (
    <div className="min-h-dvh min-h-screen bg-[#EEF2F1] dark:bg-[#0A1213] text-[#0E1B1D] dark:text-[#E6F0EE] transition-colors flex flex-col font-sans overflow-x-hidden">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewExpense={handleOpenAddExpense}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        userSession={userSession}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadCount}
        pendingRequestsCount={pendingRequestsCount}
        roommates={roommates}
      />

      {/* Hero / Editorial Masthead (Only in Admin or Viewer mode; Personal roommate dashboard has its own top welcome card) */}
      {userSession.role !== 'roommate' && (
        <HeroMasthead
          settings={settings}
          roommates={roommates}
          totalExpensesCount={expenses.length}
          totalSettlementTransfers={optionBSettlements.length}
          totalSettlementAmount={totalSettlementAmount}
          isCollapsed={isHeroCollapsed}
          onToggleCollapse={() => setIsHeroCollapsed(!isHeroCollapsed)}
        />
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 min-w-0">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0E1B1D] dark:bg-[#1C2C2F] text-white px-4 py-2.5 rounded-lg shadow-xl border border-neutral-700 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
            {toastMsg}
          </div>
        )}

        {/* 1. If in Viewer Mode: Render ONLY the unified Public Room Dashboard */}
        {userSession.role === 'viewer' ? (
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
            onSwitchToEditor={() => setIsAuthModalOpen(true)}
          />
        ) : userSession.role === 'roommate' && userSession.roommateId ? (
          /* 2. If in Roommate Mode: Render the Personal Roommate Dashboard */
          <RoommateDashboard
            myRoommateId={userSession.roommateId}
            roommates={roommates}
            expenses={expenses}
            payments={payments}
            paymentRequests={paymentRequests}
            notifications={notifications}
            auditLogs={auditLogs}
            settings={settings}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            allMonths={allMonths}
            onOpenBreakdown={handleOpenBreakdown}
            onOpenPaymentRequest={handleOpenPaymentRequestModal}
            onApprovePaymentRequest={handleApprovePaymentRequest}
            onRejectPaymentRequest={handleRejectPaymentRequest}
            onMarkNotificationAsRead={handleMarkNotificationRead}
            onUpdateMyProfile={handleUpdateMyProfile}
          />
        ) : (
          /* 3. Admin / Coordinator Suite */
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
                onClearSamples={() => {}}
                onRestoreSamples={() => {}}
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

            {currentTab === 'requests' && (
              <AdminPaymentRequestsView
                requests={paymentRequests}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
                onApprove={handleApprovePaymentRequest}
                onReject={handleRejectPaymentRequest}
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

            {currentTab === 'roommates' && (
              <RoommatesView
                roommates={roommates}
                settings={settings}
                expenses={expenses}
                payments={payments}
                onUpdateRoommates={handleUpdateRoommates}
                onUpdateSettings={handleUpdateSettings}
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
                onUpdateCategories={setCategories}
                onRestoreSampleData={() => {}}
                onClearAllData={() => {}}
                onImportJsonData={() => {}}
              />
            )}

            {currentTab === 'audit' && (
              <AuditLogView
                logs={auditLogs}
                roommates={roommates}
                currencySymbol={settings.currencySymbol}
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
            {settings.roomName} (Room {settings.roomNumber}) · {roommates.length} Roommates
          </div>
          <div>
            Amounts in {settings.currencySymbol} ({settings.currency}) · Supabase Active
          </div>
        </div>
      </footer>

      {/* Modals */}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        roommates={roommates}
        coordinatorId={settings.defaultCoordinator}
        adminPin={settings.adminPin}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToViewer={handleSwitchToViewer}
        onSetAdminPin={handleSetAdminPin}
      />

      {isBreakdownModalOpen && breakdownOtherId && userSession.roommateId && (
        <DebtBreakdownModal
          isOpen={isBreakdownModalOpen}
          onClose={() => {
            setIsBreakdownModalOpen(false);
            setBreakdownOtherId(null);
          }}
          myRoommateId={userSession.roommateId}
          otherRoommateId={breakdownOtherId}
          roommates={roommates}
          expenses={expenses}
          payments={payments}
          paymentRequests={paymentRequests}
          currencySymbol={settings.currencySymbol}
          onRequestPayment={(fromId, toId, amount) => {
            handleOpenPaymentRequestModal(fromId, toId, amount);
          }}
        />
      )}

      {isPaymentRequestModalOpen && (
        <PaymentRequestModal
          isOpen={isPaymentRequestModalOpen}
          onClose={() => setIsPaymentRequestModalOpen(false)}
          onSubmit={handleSubmitPaymentRequest}
          roommates={roommates}
          initialFromId={requestInitialFromId}
          initialToId={requestInitialToId}
          initialAmount={requestInitialAmount}
          currencySymbol={settings.currencySymbol}
        />
      )}
    </div>
  );
}
