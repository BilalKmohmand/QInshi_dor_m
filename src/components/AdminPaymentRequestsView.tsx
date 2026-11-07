import React, { useState } from 'react';
import { PaymentRequest, Roommate } from '../types';
import { formatMoney } from '../utils/calculator';
import { Clock, CheckCircle2, XCircle, Filter, ArrowRight, Shield } from 'lucide-react';

interface AdminPaymentRequestsViewProps {
  requests: PaymentRequest[];
  roommates: Roommate[];
  currencySymbol: string;
  onApprove: (request: PaymentRequest) => void;
  onReject: (requestId: string, reason?: string) => void;
}

export const AdminPaymentRequestsView: React.FC<AdminPaymentRequestsViewProps> = ({
  requests,
  roommates,
  currencySymbol,
  onApprove,
  onReject,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const roommateMap = new Map(roommates.map((r) => [r.id, r]));

  const filtered = requests.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
              Payment Request Verifications & Authorizations
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
            Coordinator clearinghouse: Review submitted transfer confirmations before they adjust balances
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white font-semibold'
                : 'bg-neutral-100 dark:bg-[#152426] text-neutral-600 dark:text-[#8FA8A5]'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-10 text-center text-xs text-neutral-400">
            No payment requests found for this filter.
          </div>
        ) : (
          filtered.map((req) => {
            const sender = roommateMap.get(req.fromRoommate);
            const recipient = roommateMap.get(req.toRoommate);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {sender?.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {recipient?.name}
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

                    <div className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-1">
                      Date: {req.date} · Method: {req.method}
                      {req.reference ? ` · Reference: ${req.reference}` : ''}
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

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApprove(req)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
