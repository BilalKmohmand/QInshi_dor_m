import React, { useState } from 'react';
import { Roommate, Expense, Payment, RoomSettings } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RoommatesViewProps {
  roommates: Roommate[];
  settings: RoomSettings;
  expenses: Expense[];
  payments: Payment[];
  onUpdateRoommates: (roommates: Roommate[]) => void;
  onUpdateSettings: (settings: RoomSettings) => void;
}

const PRESET_COLORS = [
  '#0B7A6E',
  '#2563EB',
  '#7C3AED',
  '#D97706',
  '#DC2626',
  '#059669',
  '#DB2777',
  '#4F46E5',
  '#0891B2',
  '#475569',
];

export const RoommatesView: React.FC<RoommatesViewProps> = ({
  roommates,
  settings,
  expenses,
  payments,
  onUpdateRoommates,
  onUpdateSettings,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editColor, setEditColor] = useState('');

  // Quick PIN modal / prompt state
  const [pinModalRoommate, setPinModalRoommate] = useState<Roommate | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  // Admin PIN edit state
  const [isEditingAdminPin, setIsEditingAdminPin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState(settings.adminPin || '');
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Visible PINs set (which roommate PINs are revealed to admin)
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Add roommate form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const toggleRevealPin = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (r: Roommate) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditHandle(r.handle || '');
    setEditPin(r.pin || '');
    setEditColor(r.color);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateRoommates(
      roommates.map((r) =>
        r.id === id
          ? {
              ...r,
              name: editName.trim(),
              handle: editHandle.trim() || undefined,
              pin: editPin.trim() || undefined,
              color: editColor || r.color,
            }
          : r
      )
    );
    setEditingId(null);
    showFeedbackMsg(`Saved details and PIN for roommate.`);
  };

  const handleToggleActive = (id: string) => {
    onUpdateRoommates(
      roommates.map((r) =>
        r.id === id ? { ...r, isActive: r.isActive !== false ? false : true } : r
      )
    );
  };

  const handleSetCoordinator = (id: string) => {
    onUpdateSettings({
      ...settings,
      defaultCoordinator: id,
    });
    showFeedbackMsg('Updated Room Coordinator.');
  };

  const handleOpenSetPinModal = (r: Roommate) => {
    setPinModalRoommate(r);
    setNewPinValue(r.pin || '');
  };

  const handleSaveRoommatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalRoommate) return;

    const trimmedPin = newPinValue.trim();
    if (!trimmedPin || trimmedPin.length < 3) {
      alert('PIN should be at least 3 digits.');
      return;
    }

    onUpdateRoommates(
      roommates.map((r) =>
        r.id === pinModalRoommate.id ? { ...r, pin: trimmedPin } : r
      )
    );

    showFeedbackMsg(`Updated PIN for ${pinModalRoommate.name} to "${trimmedPin}".`);
    setPinModalRoommate(null);
    setNewPinValue('');
  };

  const handleQuickResetPin = (r: Roommate) => {
    onUpdateRoommates(
      roommates.map((item) =>
        item.id === r.id ? { ...item, pin: undefined } : item
      )
    );
    showFeedbackMsg(`Cleared PIN for ${r.name}. They cannot sign in until a new PIN is set.`);
  };

  const handleSaveAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPinInput.trim();
    if (!clean) { showFeedbackMsg('Enter an admin PIN first.'); return; }
    onUpdateSettings({
      ...settings,
      adminPin: clean,
    });
    setIsEditingAdminPin(false);
    showFeedbackMsg(`Coordinator Admin PIN updated to "${clean}".`);
  };

  const showFeedbackMsg = (msg: string) => {
    setPinFeedback(msg);
    setTimeout(() => {
      setPinFeedback((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleAddRoommate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = `r_${Date.now()}`;
    const updated: Roommate[] = [
      ...roommates,
      {
        id: newId,
        name: newName.trim(),
        color: newColor || PRESET_COLORS[roommates.length % PRESET_COLORS.length],
        handle: newHandle.trim() || undefined,
        pin: newPin.trim() || undefined,
        isActive: true,
      },
    ];

    onUpdateRoommates(updated);
    setNewName('');
    setNewHandle('');
    setNewPin('');
    setShowAddForm(false);
    showFeedbackMsg(`Registered new roommate "${newName.trim()}".`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {pinFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B7A6E] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-2">
          {pinFeedback}
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0B7A6E] dark:text-[#3FC5B3]" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white font-display">
              Roommate Accounts & Access PIN Management
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5">
            Admin can view and set individual 4-digit PINs for all roommates, reassign coordinator roles, and manage handles
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Roommate</span>
        </button>
      </div>

      {/* Admin Security PIN Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-purple-950 dark:text-purple-100 font-display">
                Coordinator Admin Master PIN
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-semibold uppercase">
                Admin Auth
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-purple-800/80 dark:text-purple-300">
              <span>Current Admin PIN:</span>
              <span className="font-mono font-bold text-sm text-purple-900 dark:text-white px-2 py-0.5 rounded bg-white/80 dark:bg-[#111D1F] border border-purple-200 dark:border-purple-800">
                {showAdminPin ? (settings.adminPin || 'Not set') : '••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowAdminPin(!showAdminPin)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800"
                title={showAdminPin ? 'Hide PIN' : 'Reveal PIN'}
              >
                {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Change Admin PIN inline form or trigger */}
        {isEditingAdminPin ? (
          <form onSubmit={handleSaveAdminPin} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="New Admin PIN"
              value={adminPinInput}
              onChange={(e) => setAdminPinInput(e.target.value)}
              required
              className="w-32 px-3 py-1.5 text-xs font-mono rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#152426] text-neutral-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-xs"
            >
              Save PIN
            </button>
            <button
              type="button"
              onClick={() => setIsEditingAdminPin(false)}
              className="px-2 py-1.5 text-xs text-neutral-500 hover:underline"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAdminPinInput(settings.adminPin || '');
              setIsEditingAdminPin(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#152426] border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 transition-colors shadow-xs shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Admin PIN</span>
          </button>
        )}
      </div>

      {/* Add Roommate Modal / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddRoommate}
          className="bg-white dark:bg-[#111D1F] border border-[#0B7A6E]/30 dark:border-[#3FC5B3]/30 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-[#0B7A6E] dark:text-[#3FC5B3]">
              Register New Roommate & Set Their PIN
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Tariq"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1">
                Payment Handle (Alipay/WeChat)
              </label>
              <input
                type="text"
                placeholder="e.g. ali_pay_user"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1">
                Set Their Initial PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="Set PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1">Avatar Color</label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newColor === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] text-white hover:bg-[#09665C]"
            >
              Confirm & Add Roommate
            </button>
          </div>
        </form>
      )}

      {/* Roommates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roommates.map((r) => {
          const isCoordinator =
            r.id === settings.defaultCoordinator || r.name.toLowerCase().includes('bilal');
          const isEditing = editingId === r.id;
          const isActive = r.isActive !== false;
          const currentPin = r.pin || '';
          const isPinRevealed = !!revealedPins[r.id];

          return (
            <div
              key={r.id}
              className={`bg-white dark:bg-[#111D1F] border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors space-y-3.5 ${
                !isActive
                  ? 'border-neutral-200 dark:border-[#23393B] opacity-60'
                  : isCoordinator
                  ? 'border-purple-300 dark:border-purple-900/60'
                  : 'border-neutral-200 dark:border-[#23393B]'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {r.name}
                      </span>
                      {isCoordinator ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                          <ShieldCheck className="w-3 h-3" /> Coordinator
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-[#1C2C2F] text-neutral-600 dark:text-neutral-400">
                          Roommate
                        </span>
                      )}

                      {!isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-600">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-neutral-500 dark:text-[#8FA8A5] mt-0.5 font-mono">
                      {r.handle ? `Payment Handle: ${r.handle}` : 'No payment handle specified'}
                    </div>
                  </div>
                </div>

                {/* Edit & Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => (isEditing ? handleSaveEdit(r.id) : handleStartEdit(r))}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-[#23393B] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#152426]"
                    title={isEditing ? 'Save' : 'Edit profile'}
                  >
                    {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(r.id)}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-[#23393B] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#152426]"
                    title={isActive ? 'Deactivate account' : 'Re-activate account'}
                  >
                    {isActive ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <UserX className="w-3.5 h-3.5 text-red-500" />}
                  </button>

                  {!isCoordinator && (
                    <button
                      type="button"
                      onClick={() => handleSetCoordinator(r.id)}
                      className="px-2 py-1 text-[11px] font-mono rounded border border-neutral-200 dark:border-[#23393B] text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      title="Make Room Coordinator"
                    >
                      Make Admin
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated PIN Control Bar for this Roommate */}
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#152426] border border-neutral-200 dark:border-[#23393B] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-mono text-[11px] text-neutral-500">Access PIN:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {isPinRevealed ? currentPin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRevealPin(r.id)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title={isPinRevealed ? 'Hide PIN' : 'View PIN'}
                  >
                    {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSetPinModal(r)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#0B7A6E] hover:bg-[#09665C] dark:bg-[#3FC5B3] dark:hover:bg-[#33A899] text-white dark:text-[#04201C] transition-colors"
                  >
                    Set PIN
                  </button>

                  {currentPin && (
                    <button
                      type="button"
                      onClick={() => handleQuickResetPin(r)}
                      className="px-2 py-1 text-[11px] font-mono rounded-md border border-neutral-200 dark:border-[#23393B] hover:bg-neutral-100 dark:hover:bg-[#1C2C2F] text-neutral-500"
                      title="Clear PIN"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Editing Form when active */}
              {isEditing && (
                <div className="pt-3 border-t border-neutral-200 dark:border-[#23393B] space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-0.5">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-0.5">Payment Handle</label>
                      <input
                        type="text"
                        value={editHandle}
                        onChange={(e) => setEditHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-0.5">PIN Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        placeholder="Set PIN"
                        value={editPin}
                        onChange={(e) => setEditPin(e.target.value)}
                        className="w-full px-2 py-1 font-mono rounded border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-0.5">Color</label>
                      <div className="flex items-center gap-1 pt-1">
                        {PRESET_COLORS.slice(0, 5).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className={`w-5 h-5 rounded-full border ${
                              editColor === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-neutral-500 hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(r.id)}
                      className="px-3 py-1 bg-[#0B7A6E] text-white rounded font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Set PIN Quick Modal */}
      {pinModalRoommate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111D1F] border border-neutral-200 dark:border-[#23393B] rounded-2xl shadow-2xl p-5 text-neutral-900 dark:text-[#E6F0EE]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#23393B]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0B7A6E] dark:text-[#3FC5B3]" />
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-display">
                  Set PIN for {pinModalRoommate.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPinModalRoommate(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoommatePin} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#8FA8A5] mb-1">
                  New Access PIN (4-8 digits)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="e.g. 5678"
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-base font-mono tracking-widest text-center rounded-lg border border-neutral-300 dark:border-[#23393B] bg-neutral-50 dark:bg-[#152426] text-neutral-900 dark:text-white"
                />
                <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
                  {pinModalRoommate.name} will use this PIN to log into their personal roommate portal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-[#1E3033]">
                <button
                  type="button"
                  onClick={() => setPinModalRoommate(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#0B7A6E] hover:bg-[#09665C] text-white"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
