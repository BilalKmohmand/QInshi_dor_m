import React, { useState, useEffect } from 'react';
import { Roommate, PaymentRequest } from '../types';
import { X, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>) => void;
  roommates: Roommate[];
  initialFromId?: string;
  initialToId?: string;
  initialAmount?: number;
  currencySymbol: string;
}

export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roommates,
  initialFromId,
  initialToId,
  initialAmount,
  currencySymbol,
}) => {
  const [fromRoommate, setFromRoommate] = useState(initialFromId || roommates[0]?.id || '');
  const [toRoommate, setToRoommate] = useState(initialToId || roommates[1]?.id || '');
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('Alipay');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialFromId) setFromRoommate(initialFromId);
    if (initialToId) setToRoommate(initialToId);
    if (initialAmount) setAmount(initialAmount.toString());
    setErrorMsg('');
  }, [initialFromId, initialToId, initialAmount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromRoommate === toRoommate) {
      setErrorMsg('Payer and Recipient must be different roommates.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    onSubmit({
      fromRoommate,
      toRoommate,
      amount: parsedAmount,
      date,
      method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl.trim() || undefined,
    });

    onClose();
  };

  const recipient = roommates.find((r) => r.id === toRoommate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl shadow-2xl p-5 sm:p-6 my-6 text-neutral-900 dark:text-[#E6F0EE]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-[#23393B]">
          <div>
            <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
              Submit Payment Confirmation
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
              Submit proof of transfer to be verified by recipient
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Guarantee Warning */}
        <div className="my-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong>Verification Protocol:</strong> Submitting a payment request notifies{' '}
            <strong>{recipient?.name || 'the recipient'}</strong>. The debt remains pending until the recipient confirms the money was received.
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Payer (You)
              </label>
              <select
                value={fromRoommate}
                onChange={(e) => setFromRoommate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
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
                Recipient (Paying to)
              </label>
              <select
                value={toRoommate}
                onChange={(e) => setToRoommate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
              >
                {roommates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.handle ? `(${r.handle})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Transfer Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Payment Channel
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
              >
                <option value="Alipay">Alipay (支付宝)</option>
                <option value="WeChat Pay">WeChat Pay (微信支付)</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Bank Transfer">Bank Transfer / Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                Transaction Reference / Order #
              </label>
              <input
                type="text"
                placeholder="e.g. 2026110622001..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Notes for Recipient (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sent via Alipay for Friday dinner share"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
              Payment Screenshot / Receipt URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-[#23393B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
