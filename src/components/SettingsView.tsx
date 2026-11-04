import React, { useState } from 'react';
import { Roommate, RoomSettings, Expense, Payment, KittyDeposit } from '../types';
import { generateCsvExport } from '../utils/calculator';
import {
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Building,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  settings: RoomSettings;
  roommates: Roommate[];
  categories: string[];
  expenses: Expense[];
  payments: Payment[];
  kittyDeposits: KittyDeposit[];
  onUpdateSettings: (newSettings: RoomSettings) => void;
  onUpdateRoommates: (newRoommates: Roommate[]) => void;
  onUpdateCategories: (newCategories: string[]) => void;
  onRestoreSampleData: () => void;
  onClearAllData: () => void;
  onImportJsonData: (data: {
    settings: RoomSettings;
    roommates: Roommate[];
    categories: string[];
    expenses: Expense[];
    payments: Payment[];
    kittyDeposits?: KittyDeposit[];
  }) => void;
}

const PRESET_CURRENCIES = [
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (¥)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee (₨)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
];

const COLOR_PALETTE = [
  '#0B7A6E',
  '#2563EB',
  '#7C3AED',
  '#D97706',
  '#DC2626',
  '#059669',
  '#DB2777',
  '#4F46E5',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  roommates,
  categories,
  expenses,
  payments,
  kittyDeposits,
  onUpdateSettings,
  onUpdateRoommates,
  onUpdateCategories,
  onRestoreSampleData,
  onClearAllData,
  onImportJsonData,
}) => {
  // Local states for settings form
  const [roomName, setRoomName] = useState(settings.roomName);
  const [roomNumber, setRoomNumber] = useState(settings.roomNumber);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [currency, setCurrency] = useState(settings.currency);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget.toString());
  const [defaultCoordinator, setDefaultCoordinator] = useState(settings.defaultCoordinator);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  // New roommate form
  const [newRoommateName, setNewRoommateName] = useState('');
  const [newRoommateHandle, setNewRoommateHandle] = useState('');

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      roomName: roomName.trim() || 'Hostel Room Ledger',
      roomNumber: roomNumber.trim() || '304',
      currency,
      currencySymbol,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
      defaultCoordinator,
    });
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 3000);
  };

  const handleCurrencyChange = (currCode: string) => {
    const found = PRESET_CURRENCIES.find((c) => c.code === currCode);
    if (found) {
      setCurrency(found.code);
      setCurrencySymbol(found.symbol);
    }
  };

  const handleUpdateRoommateName = (id: string, name: string) => {
    onUpdateRoommates(
      roommates.map((r) => (r.id === id ? { ...r, name: name || r.name } : r))
    );
  };

  const handleUpdateRoommateHandle = (id: string, handle: string) => {
    onUpdateRoommates(
      roommates.map((r) => (r.id === id ? { ...r, handle } : r))
    );
  };

  const handleAddRoommate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoommateName.trim()) return;

    const newId = `r_${Date.now()}`;
    const nextColor = COLOR_PALETTE[roommates.length % COLOR_PALETTE.length];

    const updated = [
      ...roommates,
      {
        id: newId,
        name: newRoommateName.trim(),
        color: nextColor,
        handle: newRoommateHandle.trim() || undefined,
      },
    ];

    onUpdateRoommates(updated);
    setNewRoommateName('');
    setNewRoommateHandle('');
  };

  const handleDeleteRoommate = (id: string) => {
    if (roommates.length <= 2) {
      alert('You need at least two roommates in the ledger.');
      return;
    }
    const hasExpenses = expenses.some((e) => e.paidBy === id || e.split.includes(id));
    if (hasExpenses) {
      if (!confirm('This roommate has logged expenses or shares. Are you sure you want to remove them?')) {
        return;
      }
    }
    onUpdateRoommates(roommates.filter((r) => r.id !== id));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCategoryName.trim();
    if (val && !categories.includes(val)) {
      onUpdateCategories([...categories, val]);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (categories.length <= 1) return;
    onUpdateCategories(categories.filter((c) => c !== cat));
  };

  const handleExportCsv = () => {
    const csvContent = generateCsvExport(expenses, payments, roommates);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${roomName.replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      roommates,
      categories,
      expenses,
      payments,
      kittyDeposits,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${roomName.replace(/\s+/g, '_')}_backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.roommates && parsed.expenses) {
          onImportJsonData(parsed);
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Room General Settings */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Room Profile & Ledger Settings
          </h3>
        </div>

        {savedSettingsMsg && (
          <div className="mb-4 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" /> Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Room Title / Label
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Hostel Room 304"
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Room / Flat Number
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="304"
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            >
              {PRESET_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Monthly Budget Goal ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="1500"
              className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Default Settlement Coordinator
            </label>
            <select
              value={defaultCoordinator}
              onChange={(e) => setDefaultCoordinator(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            >
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" /> Save Profile Settings
            </button>
          </div>
        </form>
      </div>

      {/* Roommates Management */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Roommates ({roommates.length})
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Edit roommate names, avatars, and payment methods. All expenses and balances update automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roommates.map((r) => (
            <div
              key={r.id}
              className="p-3 border border-neutral-200 dark:border-[#23393B] rounded-lg bg-neutral-50 dark:bg-[#152426] space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <input
                    type="text"
                    defaultValue={r.name}
                    onBlur={(e) => handleUpdateRoommateName(r.id, e.target.value)}
                    className="font-bold text-xs bg-white dark:bg-[#111D1F] border border-neutral-300 dark:border-[#23393B] rounded px-2 py-1 text-neutral-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteRoommate(r.id)}
                  className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                  title="Remove roommate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">
                  Payment Handle (WeChat / Alipay / UPI / Cash)
                </label>
                <input
                  type="text"
                  defaultValue={r.handle || ''}
                  placeholder="e.g. Alipay: 138..., WeChat: john"
                  onBlur={(e) => handleUpdateRoommateHandle(r.id, e.target.value)}
                  className="w-full text-xs bg-white dark:bg-[#111D1F] border border-neutral-300 dark:border-[#23393B] rounded px-2 py-1 text-neutral-900 dark:text-white font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Roommate */}
        <form onSubmit={handleAddRoommate} className="pt-3 border-t border-neutral-200 dark:border-[#23393B] flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Add New Roommate Name
            </label>
            <input
              type="text"
              placeholder="e.g. Tariq"
              value={newRoommateName}
              onChange={(e) => setNewRoommateName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Payment info (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Revolut / Cash"
              value={newRoommateHandle}
              onChange={(e) => setNewRoommateHandle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Roommate
          </button>
        </form>
      </div>

      {/* Categories Management */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Expense Categories
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Organize shared purchases (Food, Utilities, Supplies, etc.)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#152426] text-xs font-mono text-neutral-800 dark:text-[#E6F0EE] border border-neutral-200 dark:border-[#23393B]"
            >
              <span>{c}</span>
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c)}
                  className="text-neutral-400 hover:text-red-600 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="flex items-center gap-3 pt-2">
          <input
            type="text"
            placeholder="New Category (e.g. Laundry, Rent, Electricity)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-64 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE]"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-200 dark:bg-[#1C2C2F] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-[#23393B] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </form>
      </div>

      {/* Data Management & Backups */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Data Management, Export & Backup
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
            Save offline copies, export spreadsheets for Excel, or reset data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-[#23393B] hover:bg-neutral-50 dark:hover:bg-[#152426] text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV Spreadsheet
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-[#23393B] hover:bg-neutral-50 dark:hover:bg-[#152426] text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <Download className="w-4 h-4" /> Backup JSON
          </button>

          <label className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-[#23393B] hover:bg-neutral-50 dark:hover:bg-[#152426] text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Restore JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onRestoreSampleData}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Sample Data
          </button>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-[#1E3033]">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear all expenses and payments? This cannot be undone.')) {
                onClearAllData();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Clear All Room Data (Wipe Slate)
          </button>
        </div>
      </div>
    </div>
  );
};
