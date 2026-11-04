/**
 * Types for Hostel Room Expense Tracker
 */

export interface Roommate {
  id: string;
  name: string;
  color: string;
  handle?: string; // UPI, Alipay, WeChat, Venmo, Cash, etc.
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
  sample?: boolean;
}

export interface Payment {
  id: string;
  date: string;
  from: string; // roommate id
  to: string; // roommate id
  amount: number;
  note?: string;
  sample?: boolean;
}

export interface KittyDeposit {
  id: string;
  date: string;
  roommateId: string;
  amount: number;
  note?: string;
}

export interface RoomSettings {
  roomName: string;
  roomNumber: string;
  currency: string;
  currencySymbol: string;
  monthlyBudget: number;
  defaultCoordinator: string;
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
}
