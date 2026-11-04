import React, { useState, useEffect } from 'react';
import { Expense, Roommate, SplitMode } from '../types';
import { X, Check, Calculator, Sparkles } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
  expenseToEdit?: Expense | null;
  roommates: Roommate[];
  categories: string[];
  currencySymbol: string;
  hasKitty?: boolean;
  kittyBalance?: number;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  roommates,
  categories,
  currencySymbol,
  hasKitty = false,
  kittyBalance = 0,
}) => {
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [what, setWhat] = useState('');
  const [cat, setCat] = useState(categories[0] || 'Food');
  const [amount, setAmount] = useState<string>('');
  const [paidBy, setPaidBy] = useState(roommates[0]?.id || '');
  const [split, setSplit] = useState<string[]>(roommates.map((r) => r.id));
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date);
      setWhat(expenseToEdit.what);
      setCat(expenseToEdit.cat);
      setAmount(expenseToEdit.amount.toString());
      setPaidBy(expenseToEdit.paidBy);
      setSplit(expenseToEdit.split || []);
      setSplitMode(expenseToEdit.splitMode || 'equal');
      setCustomAmounts(expenseToEdit.customAmounts || {});
      setCustomShares(expenseToEdit.customShares || {});
      setNotes(expenseToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setWhat('');
      setCat(categories[0] || 'Food');
      setAmount('');
      setPaidBy(roommates[0]?.id || '');
      setSplit(roommates.map((r) => r.id));
      setSplitMode('equal');
      setCustomAmounts({});
      setCustomShares({});
      setNotes('');
    }
    setErrorMsg('');
  }, [expenseToEdit, isOpen, roommates, categories]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;

  const toggleRoommateSplit = (id: string) => {
    if (split.includes(id)) {
      setSplit(split.filter((item) => item !== id));
    } else {
      setSplit([...split, id]);
    }
  };

  const selectAllSplit = () => {
    setSplit(roommates.map((r) => r.id));
  };

  const clearAllSplit = () => {
    setSplit([]);
  };

  const handleCustomAmountChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomAmounts((prev) => ({ ...prev, [id]: num }));
  };

  const handleCustomShareChange = (id: string, val: string) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setCustomShares((prev) => ({ ...prev, [id]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!what.trim()) {
      setErrorMsg('Please describe what this expense was for.');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }
    if (split.length === 0) {
      setErrorMsg('Please select at least one roommate sharing this expense.');
      return;
    }

    if (splitMode === 'exact') {
      const sumExact = split.reduce((sum, id) => sum + (customAmounts[id] || 0), 0);
      if (Math.abs(sumExact - parsedAmount) > 0.01) {
        setErrorMsg(
          `Custom split sum (${currencySymbol}${sumExact.toFixed(2)}) must match total amount (${currencySymbol}${parsedAmount.toFixed(2)}). Difference: ${currencySymbol}${Math.abs(sumExact - parsedAmount).toFixed(2)}`
        );
        return;
      }
    }

    const expenseData: Omit<Expense, 'id'> | Expense = {
      ...(expenseToEdit ? { id: expenseToEdit.id } : {}),
      date,
      what: what.trim(),
      cat,
      amount: parsedAmount,
      paidBy,
      split,
      splitMode,
      customAmounts: splitMode === 'exact' ? customAmounts : undefined,
      customShares: splitMode === 'shares' ? customShares : undefined,
      notes: notes.trim(),
      sample: expenseToEdit?.sample || false,
    };

    onSave(expenseData);
    onClose();
  };

  const applyQuickPreset = (presetName: string, presetCat: string, presetAmount?: number) => {
    setWhat(presetName);
    setCat(presetCat);
    if (presetAmount) setAmount(presetAmount.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl shadow-2xl p-6 my-8 text-neutral-900 dark:text-[#E6F0EE]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-[#23393B]">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight">
              {expenseToEdit ? 'Edit Room Expense' : 'Log New Shared Expense'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
              Record a purchase and specify who shares it
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        {!expenseToEdit && (
          <div className="pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto text-xs text-neutral-500 dark:text-[#8FA8A5]">
            <span className="shrink-0 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#0B7A6E] dark:text-[#3FC5B3]" /> Quick:
            </span>
            <button
              type="button"
              onClick={() => applyQuickPreset('Drinking water (4 bottles)', 'Utilities', 60)}
              className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#192A2C] hover:bg-neutral-200 dark:hover:bg-[#23393B] text-neutral-700 dark:text-neutral-200 whitespace-nowrap transition-colors"
            >
              Water 60¥
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('Room WiFi bill', 'Internet', 100)}
              className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#192A2C] hover:bg-neutral-200 dark:hover:bg-[#23393B] text-neutral-700 dark:text-neutral-200 whitespace-nowrap transition-colors"
            >
              WiFi 100¥
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('Cleaning supplies & trash bags', 'Supplies', 35)}
              className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#192A2C] hover:bg-neutral-200 dark:hover:bg-[#23393B] text-neutral-700 dark:text-neutral-200 whitespace-nowrap transition-colors"
            >
              Cleaning 35¥
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('Group dinner', 'Food')}
              className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#192A2C] hover:bg-neutral-200 dark:hover:bg-[#23393B] text-neutral-700 dark:text-neutral-200 whitespace-nowrap transition-colors"
            >
              Group Dinner
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Category
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                What was it
              </label>
              <input
                type="text"
                placeholder="e.g. Drinking water bottles, dinner, wifi"
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-mono text-neutral-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
                />
              </div>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Who paid?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roommates.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setPaidBy(r.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                    paidBy === r.id
                      ? 'border-[#0B7A6E] dark:border-[#3FC5B3] bg-[#D7EEEA] dark:bg-[#123A36] text-[#0B7A6E] dark:text-[#3FC5B3]'
                      : 'border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.name}</span>
                  {paidBy === r.id && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              ))}

              {hasKitty && (
                <button
                  type="button"
                  onClick={() => setPaidBy('KITTY')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                    paidBy === 'KITTY'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">Room Kitty ({currencySymbol}{kittyBalance.toFixed(0)})</span>
                  {paidBy === 'KITTY' && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              )}
            </div>
          </div>

          {/* Split Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5]">
                Split Mode
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    splitMode === 'equal'
                      ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                      : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#1C2C2F]'
                  }`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode('exact');
                    // Initialize exact custom amounts if empty
                    if (Object.keys(customAmounts).length === 0 && parsedAmount > 0 && split.length > 0) {
                      const per = +(parsedAmount / split.length).toFixed(2);
                      const initialExact: Record<string, number> = {};
                      split.forEach((id) => {
                        initialExact[id] = per;
                      });
                      setCustomAmounts(initialExact);
                    }
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    splitMode === 'exact'
                      ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                      : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#1C2C2F]'
                  }`}
                >
                  Exact Amounts
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('shares')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    splitMode === 'shares'
                      ? 'bg-[#0B7A6E] text-white dark:bg-[#3FC5B3] dark:text-[#04201C] font-semibold'
                      : 'text-neutral-600 dark:text-[#8FA8A5] hover:bg-neutral-100 dark:hover:bg-[#1C2C2F]'
                  }`}
                >
                  Shares / Units
                </button>
              </div>
            </div>

            {/* Split Members Checklist */}
            <div className="p-3 bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] rounded-lg">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8FA8A5] mb-2.5">
                <span>Shared between ({split.length} of {roommates.length})</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllSplit}
                    className="hover:text-[#0B7A6E] dark:hover:text-[#3FC5B3] transition-colors"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={clearAllSplit}
                    className="hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {roommates.map((r) => {
                  const isChecked = split.includes(r.id);
                  let shareDetail = '';
                  if (isChecked && parsedAmount > 0) {
                    if (splitMode === 'equal') {
                      shareDetail = `${currencySymbol}${(parsedAmount / split.length).toFixed(2)}`;
                    } else if (splitMode === 'shares') {
                      const userShares = customShares[r.id] || 1;
                      const totalShares = split.reduce((acc, sid) => acc + (customShares[sid] || 1), 0);
                      const userCost = (parsedAmount * (userShares / totalShares)).toFixed(2);
                      shareDetail = `${currencySymbol}${userCost} (${userShares} share${userShares > 1 ? 's' : ''})`;
                    }
                  }

                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-2 rounded-md border text-xs transition-colors ${
                        isChecked
                          ? 'border-neutral-300 dark:border-[#23393B] bg-white dark:bg-[#111D1F]'
                          : 'border-transparent opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRoommateSplit(r.id)}
                          className="rounded border-neutral-300 text-[#0B7A6E] focus:ring-[#0B7A6E]"
                        />
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {r.name}
                        </span>
                      </label>

                      {isChecked && splitMode === 'equal' && (
                        <span className="font-mono text-neutral-500 dark:text-[#8FA8A5]">
                          {shareDetail}
                        </span>
                      )}

                      {isChecked && splitMode === 'exact' && (
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-400 font-mono">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customAmounts[r.id] ?? ''}
                            onChange={(e) => handleCustomAmountChange(r.id, e.target.value)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 text-xs font-mono tabular-nums rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-right"
                          />
                        </div>
                      )}

                      {isChecked && splitMode === 'shares' && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-neutral-500 dark:text-[#8FA8A5]">
                            {shareDetail}
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={customShares[r.id] ?? 1}
                            onChange={(e) => handleCustomShareChange(r.id, e.target.value)}
                            className="w-14 px-2 py-1 text-xs font-mono text-center rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
                          />
                          <span className="text-neutral-400 text-[11px]">shares</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {splitMode === 'exact' && parsedAmount > 0 && (
                <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-[#23393B] flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">Total Allocated:</span>
                  <span
                    className={
                      Math.abs(
                        split.reduce((acc, id) => acc + (customAmounts[id] || 0), 0) - parsedAmount
                      ) < 0.01
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-red-500 font-bold'
                    }
                  >
                    {currencySymbol}
                    {split
                      .reduce((acc, id) => acc + (customAmounts[id] || 0), 0)
                      .toFixed(2)}{' '}
                    / {currencySymbol}
                    {parsedAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Receipt photo taken by Ali, bought at Walmart"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:outline-hidden focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-[#23393B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
            >
              {expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
