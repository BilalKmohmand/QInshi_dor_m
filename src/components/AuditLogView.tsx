import React, { useState } from 'react';
import { AuditLog, Roommate } from '../types';
import { formatMoney } from '../utils/calculator';
import { History, Search, Shield, Filter } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  roommates: Roommate[];
  currencySymbol: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  roommates,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.entityType !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchActor = log.actorName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAction && !matchActor && !matchDetails) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
              Immutable Financial Audit Trail
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
            Append-only record of all expense additions, edits, payment submissions, and approval events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
          >
            <option value="all">All Events</option>
            <option value="expense">Expenses</option>
            <option value="payment">Payments</option>
            <option value="payment_request">Requests</option>
            <option value="kitty">Kitty</option>
            <option value="settings">Settings</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-[#23393B] text-[11px] font-mono text-neutral-400 uppercase">
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Actor</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Entity</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-[#1C2C2F]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#162729]">
                  <td className="py-2.5 px-3 font-mono text-neutral-500 whitespace-nowrap">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                    {log.actorName}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                    {log.entityType}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900 dark:text-white whitespace-nowrap">
                    {log.amount ? formatMoney(log.amount, currencySymbol) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 dark:text-[#8FA8A5]">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
