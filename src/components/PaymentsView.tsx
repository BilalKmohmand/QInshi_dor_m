import React, { useState } from 'react';
import { Payment, Roommate } from '../types';
import { formatMoney } from '../utils/calculator';
import { Plus, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  roommates: Roommate[];
  currencySymbol: string;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  roommates,
  currencySymbol,
  onAddPayment,
  onDeletePayment,
}) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(roommates[1]?.id || '');
  const [to, setTo] = useState(roommates[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (from === to) {
      setErrorMsg('The sender and receiver must be different roommates.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    onAddPayment({
      date,
      from,
      to,
      amount: parsedAmount,
      note: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
    setSuccessMsg(
      `Logged payment of ${currencySymbol}${parsedAmount.toFixed(2)} from ${
        roommateMap.get(from)?.name
      } to ${roommateMap.get(to)?.name}!`
    );

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const sortedPayments = [...payments].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalTransferred = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="bg-[#D7EEEA]/40 dark:bg-[#123A36]/40 border border-[#0B7A6E]/20 dark:border-[#3FC5B3]/20 rounded-xl p-4 text-xs text-neutral-700 dark:text-[#E6F0EE]">
        <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
          Record Direct Cash & Digital Money Transfers
        </div>
        <p className="text-neutral-600 dark:text-[#8FA8A5]">
          When a roommate transfers cash or pays through Alipay, WeChat, UPI, or Revolut to settle balances, log it here.
          The debt reduces automatically and the running balance updates immediately.
        </p>
      </div>

      {/* Log Payment Form */}
      <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 font-display mb-3">
          Log a New Repayment
        </h3>

        {errorMsg && (
          <div className="mb-3 p-2.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-lg">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Who gave (Sender)
            </label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            >
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Who received (Recipient)
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            >
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-neutral-400">
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
                className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
              />
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Payment Reference / Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alipay transfer #8291, cash handed in kitchen"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-[#E6F0EE] focus:ring-2 focus:ring-[#0B7A6E]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Payment
            </button>
          </div>
        </form>
      </div>

      {/* Payments History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-[#8FA8A5]">
          <span>Logged Payments ({sortedPayments.length})</span>
          <span>
            Total Settled: <strong className="text-neutral-900 dark:text-neutral-100">{formatMoney(totalTransferred, currencySymbol)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-[#0D181A] border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-500 dark:text-[#8FA8A5] uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Gave (Sender)</th>
                <th className="py-3 px-3 text-center">Transfer</th>
                <th className="py-3 px-3">Received (Recipient)</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Note</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-[#23393B]">
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-400 dark:text-[#8FA8A5]">
                    No payments logged yet. When roommates settle up, log payments here.
                  </td>
                </tr>
              ) : (
                sortedPayments.map((p) => {
                  const fromR = roommateMap.get(p.from);
                  const toR = roommateMap.get(p.to);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-[#162729] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono tabular-nums text-neutral-600 dark:text-[#8FA8A5]">
                        {p.date}
                      </td>

                      <td className="py-3 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: fromR?.color || '#0B7A6E' }}
                          />
                          {fromR?.name || p.from}
                        </span>
                        {p.sample && (
                          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            Sample
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-neutral-400">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                      </td>

                      <td className="py-3 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: toR?.color || '#0B7A6E' }}
                          />
                          {toR?.name || p.to}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatMoney(p.amount, currencySymbol)}
                      </td>

                      <td className="py-3 px-3 text-neutral-500 dark:text-[#8FA8A5]">
                        {p.note || '—'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeletePayment(p.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
