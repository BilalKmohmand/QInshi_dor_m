/**
 * Complete Types for Hostel Room Expense Tracker
 */

export interface Roommate {
  id: string;
  name: string;
  color: string;
  handle?: string; // UPI, Alipay, WeChat, Venmo, Cash, etc.
  pin?: string; // Optional PIN for roommate personal account access
  isActive?: boolean;
}

export type SplitMode = 'equal' | 'exact' | 'shares';

export interface Expense {
  id: string;
  date: string;
  what: string;
  cat: string;
  amount: number;
  paidBy: string; // roommate id or 'KITTY'
  split: string[]; // array of roommate ids
  splitMode: SplitMode;
  customAmounts?: Record<string, number>; // if splitMode === 'exact'
  customShares?: Record<string, number>; // if splitMode === 'shares'
  notes?: string;
  receiptUrl?: string;
  sample?: boolean;
  createdAt?: string;
}

export interface Payment {
  id: string;
  date: string;
  from: string; // roommate id
  to: string; // roommate id
  amount: number;
  note?: string;
  method?: string;
  reference?: string;
  requestId?: string; // linked payment request ID if settled through workflow
  sample?: boolean;
  createdAt?: string;
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected' | 'disputed' | 'cancelled';

export interface PaymentRequest {
  id: string;
  fromRoommate: string; // roommate ID who paid
  toRoommate: string; // roommate ID who should receive
  amount: number;
  date: string;
  method: string; // 'Alipay' | 'WeChat Pay' | 'Cash' | 'Bank Transfer' | 'Other'
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  status: PaymentRequestStatus;
  reviewedBy?: string; // roommate ID who approved/rejected
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface KittyDeposit {
  id: string;
  date: string;
  roommateId: string;
  amount: number;
  note?: string;
  createdAt?: string;
}

export interface RoomSettings {
  id?: string;
  roomName: string;
  roomNumber: string;
  currency: string;
  currencySymbol: string;
  monthlyBudget: number;
  defaultCoordinator: string;
  adminPin?: string;
}

export interface BalanceStat {
  paid: Record<string, number>;
  share: Record<string, number>;
  net: Record<string, number>;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
  reason?: string;
}

export type NotificationType =
  | 'expense_added'
  | 'payment_submitted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'balance_alert'
  | 'kitty_update'
  | 'announcement';

export interface AppNotification {
  id: string;
  recipientId: string; // roommate ID or 'ALL'
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkTab?: string;
  relatedId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string; // roommate ID who performed the action
  actorName: string;
  action: string; // e.g. "Added expense", "Approved payment request", "Edited settings"
  entityType: 'expense' | 'payment' | 'payment_request' | 'kitty' | 'roommate' | 'settings';
  entityId?: string;
  amount?: number;
  details: string;
  timestamp: string;
}

export interface DebtBreakdownItem {
  expenseId: string;
  what: string;
  category: string;
  date: string;
  originalAmount: number;
  paidById: string;
  paidByName: string;
  splitMembersCount: number;
  myShare: number;
  otherShare: number;
  direction: 'i_owe' | 'they_owe';
  amountOwed: number; // raw debt for this item before direct repayments
}

export interface PairwiseDebtSummary {
  otherRoommate: Roommate;
  iOweThemGross: number; // sum of their purchases where I shared
  theyOweMeGross: number; // sum of my purchases where they shared
  iPaidThemVerified: number; // verified payments from me to them
  theyPaidMeVerified: number; // verified payments from them to me
  netBalance: number; // positive = they owe me, negative = I owe them, zero = settled
  items: DebtBreakdownItem[];
  pendingRequests: PaymentRequest[];
}

export type UserRole = 'admin' | 'roommate' | 'viewer';

export interface UserSession {
  isLoggedIn: boolean;
  role: UserRole;
  roommateId: string | null;
  roommateName: string | null;
  email: string | null;
}
