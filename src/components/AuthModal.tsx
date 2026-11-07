import React, { useEffect, useState } from 'react';
import { Roommate, UserSession } from '../types';
import {
  X,
  UserCheck,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  roommates: Roommate[];
  coordinatorId: string;
  adminPin?: string;
  onLoginSuccess: (session: UserSession) => void;
  onSwitchToViewer: () => void;
  onSetAdminPin?: (pin: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  roommates,
  coordinatorId,
  adminPin,
  onLoginSuccess,
  onSwitchToViewer,
  onSetAdminPin,
}) => {
  const needsAdminSetup = !adminPin?.trim();
  const [loginType, setLoginType] = useState<'roommate' | 'admin'>('roommate');
  const [selectedRoommateId, setSelectedRoommateId] = useState<string>(roommates[0]?.id || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setConfirmPin('');
    setErrorMessage('');
    setShowPin(false);
    if (needsAdminSetup) setLoginType('admin');
    if (roommates[0] && !selectedRoommateId) setSelectedRoommateId(roommates[0].id);
  }, [isOpen, needsAdminSetup, roommates, selectedRoommateId]);

  if (!isOpen) return null;

  const coordinatorRoommate =
    roommates.find((r) => r.id === coordinatorId) ||
    roommates.find((r) => r.name.toLowerCase().includes('bilal')) ||
    roommates[0];

  const handleRoommateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetRoommate = roommates.find((r) => r.id === selectedRoommateId);
    if (!targetRoommate) {
      setErrorMessage('Please select a valid roommate profile.');
      return;
    }

    if (!targetRoommate.pin?.trim()) {
      setErrorMessage(
        `No PIN set for ${targetRoommate.name}. Ask the coordinator to set one in Roommates / Settings.`
      );
      return;
    }

    if (pin.trim() !== targetRoommate.pin.trim()) {
      setErrorMessage(`Incorrect PIN for ${targetRoommate.name}.`);
      return;
    }

    const isCoordinator = targetRoommate.id === coordinatorId;

    onLoginSuccess({
      isLoggedIn: true,
      role: isCoordinator ? 'admin' : 'roommate',
      roommateId: targetRoommate.id,
      roommateName: targetRoommate.name,
      email: null,
    });
    onClose();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (needsAdminSetup) {
      if (pin.trim().length < 4) {
        setErrorMessage('Choose an admin PIN with at least 4 digits.');
        return;
      }
      if (pin.trim() !== confirmPin.trim()) {
        setErrorMessage('PIN confirmation does not match.');
        return;
      }
      onSetAdminPin?.(pin.trim());
      onLoginSuccess({
        isLoggedIn: true,
        role: 'admin',
        roommateId: coordinatorRoommate?.id || null,
        roommateName: coordinatorRoommate
          ? `${coordinatorRoommate.name} (Coordinator)`
          : 'Coordinator',
        email: null,
      });
      onClose();
      return;
    }

    if (pin.trim() !== adminPin!.trim()) {
      setErrorMessage('Incorrect Admin PIN.');
      return;
    }

    onLoginSuccess({
      isLoggedIn: true,
      role: 'admin',
      roommateId: coordinatorRoommate?.id || null,
      roommateName: coordinatorRoommate
        ? `${coordinatorRoommate.name} (Coordinator)`
        : 'Coordinator',
      email: null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 mt-auto sm:my-6 text-neutral-900 dark:text-[#E6F0EE] max-h-[92dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#23393B]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0B7A6E] dark:bg-[#3FC5B3] flex items-center justify-center text-white dark:text-[#04201C] shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-display text-neutral-900 dark:text-white truncate">
                Sign In
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8FA8A5]">
                Use your personal PIN — no shared placeholders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center bg-neutral-100 dark:bg-[#152426] p-1 rounded-xl my-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setLoginType('roommate');
              setErrorMessage('');
              setPin('');
              setConfirmPin('');
            }}
            className={`flex-1 min-h-10 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              loginType === 'roommate'
                ? 'bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Roommate
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setErrorMessage('');
              setPin('');
              setConfirmPin('');
            }}
            className={`flex-1 min-h-10 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              loginType === 'admin'
                ? 'bg-white dark:bg-[#111D1F] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Admin
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {loginType === 'roommate' ? (
          <form onSubmit={handleRoommateLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-2">
                Select your name
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-44 sm:max-h-52 overflow-y-auto overscroll-contain pr-1">
                {roommates.map((r) => {
                  const isSelected = selectedRoommateId === r.id;
                  const isCoord = r.id === coordinatorId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoommateId(r.id);
                        setErrorMessage('');
                      }}
                      className={`flex items-center gap-2 min-h-11 p-2.5 rounded-lg border text-xs font-medium transition-colors text-left ${
                        isSelected
                          ? 'border-[#0B7A6E] dark:border-[#3FC5B3] bg-[#D7EEEA]/40 dark:bg-[#123A36]/40 text-[#0B7A6E] dark:text-[#3FC5B3] font-bold'
                          : 'border-neutral-200 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <div className="truncate flex-1">
                        <div className="truncate">{r.name}</div>
                        {isCoord && (
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                            Coordinator
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1.5 block">
                Your PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                  className="w-full min-h-11 px-3.5 py-2.5 text-sm font-mono tracking-widest rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Forgot PIN? Ask the room coordinator to reset it.
              </p>
            </div>

            <button
              type="submit"
              className="w-full min-h-11 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200">
              {needsAdminSetup
                ? 'First-time setup: create a private Admin PIN. It will not be shown again as a default.'
                : 'Coordinator access for approvals, PINs, and full ledger edits.'}
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1.5 block">
                {needsAdminSetup ? 'Create Admin PIN' : 'Admin PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder={needsAdminSetup ? 'Choose a PIN (4+ digits)' : 'Enter Admin PIN'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                  className="w-full min-h-11 px-3.5 py-2.5 text-sm font-mono tracking-widest rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {needsAdminSetup && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1.5 block">
                  Confirm Admin PIN
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Re-enter Admin PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full min-h-11 px-3.5 py-2.5 text-sm font-mono tracking-widest rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-11 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{needsAdminSetup ? 'Save PIN & Enter Admin' : 'Enter Admin Suite'}</span>
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-[#23393B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-500">
          <span>Just browsing?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToViewer();
            }}
            className="flex items-center gap-1 font-medium text-[#0B7A6E] dark:text-[#3FC5B3] min-h-10"
          >
            <Eye className="w-3.5 h-3.5" /> Public Viewer Mode
          </button>
        </div>
      </div>
    </div>
  );
};
