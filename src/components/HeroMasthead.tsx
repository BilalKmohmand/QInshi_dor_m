import React from 'react';
import { RoomSettings, Roommate } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HeroMastheadProps {
  settings: RoomSettings;
  roommates: Roommate[];
  totalExpensesCount: number;
  totalSettlementTransfers: number;
  totalSettlementAmount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}


export const HeroMasthead: React.FC<HeroMastheadProps> = ({
  settings,
  roommates,
  totalExpensesCount,
  totalSettlementTransfers,
  totalSettlementAmount,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className="bg-[#0E1B1D] text-[#EAF3F1] border-b border-[#23393B] relative">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#8FA8A5] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate max-w-[12rem] sm:max-w-none">{settings.roomName}</span>
              <span className="text-[#3FC5B3]">·</span>
              <span>Room {settings.roomNumber}</span>
              <span className="text-[#3FC5B3] hidden xs:inline sm:inline">·</span>
              <span className="hidden sm:inline">Shared Living Ledger</span>
            </div>

            <h1 className="text-xl sm:text-4xl md:text-5xl font-extrabold font-display tracking-tight text-[#EAF3F1] mt-2 max-w-2xl text-balance leading-tight">
              Hostel Room Expense Tracker
            </h1>

            {!isCollapsed && (
              <p className="mt-2 text-xs sm:text-sm text-[#8FA8A5] max-w-2xl leading-relaxed">
                One shared ledger for an {roommates.length}-person room. Log a purchase in ten seconds, see who owes whom in real-time, and settle the month with the fewest possible transfers.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg border border-[#23393B] text-[#8FA8A5] hover:text-[#EAF3F1] transition-colors shrink-0"
            title={isCollapsed ? 'Expand banner' : 'Collapse banner'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Fact Strip */}
        {!isCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#23393B] border border-[#23393B] rounded-lg overflow-hidden mt-6">
            <div className="bg-[#0E1B1D] p-3.5">
              <div className="font-mono text-xl sm:text-2xl font-semibold text-[#3FC5B3] tabular-nums">
                {roommates.length}
              </div>
              <div className="text-[11px] text-[#8FA8A5] mt-0.5">
                Roommates on ledger
              </div>
            </div>

            <div className="bg-[#0E1B1D] p-3.5">
              <div className="font-mono text-xl sm:text-2xl font-semibold text-[#3FC5B3] tabular-nums">
                {totalExpensesCount}
              </div>
              <div className="text-[11px] text-[#8FA8A5] mt-0.5">
                Logged shared purchases
              </div>
            </div>

            <div className="bg-[#0E1B1D] p-3.5">
              <div className="font-mono text-xl sm:text-2xl font-semibold text-[#3FC5B3] tabular-nums">
                2 Modes
              </div>
              <div className="text-[11px] text-[#8FA8A5] mt-0.5">
                Coordinator or P2P
              </div>
            </div>

            <div className="bg-[#0E1B1D] p-3.5">
              <div className="font-mono text-xl sm:text-2xl font-semibold text-[#3FC5B3] tabular-nums">
                {totalSettlementTransfers === 0
                  ? `${settings.currencySymbol}0.00`
                  : `${settings.currencySymbol}${totalSettlementAmount.toFixed(2)}`}
              </div>
              <div className="text-[11px] text-[#8FA8A5] mt-0.5">
                {totalSettlementTransfers === 0
                  ? 'All balances settled'
                  : `${totalSettlementTransfers} pending transfer${totalSettlementTransfers > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

