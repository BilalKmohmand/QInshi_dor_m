import { Roommate } from '../types';

const NAME_CACHE_KEY = 'hostel_roommate_name_cache_v1';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readNameCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NAME_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Remember id → name so expense history still shows names if a roommate is removed from the roster. */
export function rememberRoommateNames(roommates: Roommate[]) {
  const cache = readNameCache();
  let changed = false;
  roommates.forEach((r) => {
    if (r.id && r.name && cache[r.id] !== r.name) {
      cache[r.id] = r.name;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(NAME_CACHE_KEY, JSON.stringify(cache));
}

export function roommateName(
  id: string | null | undefined,
  roommates: Roommate[],
  fallback = 'Unknown'
): string {
  if (!id) return fallback;
  if (id === 'KITTY') return 'Room Kitty';

  const live = roommates.find((r) => r.id === id);
  if (live?.name) return live.name;

  const cached = readNameCache()[id];
  if (cached) return cached;

  // Never dump a raw UUID into the UI
  if (UUID_RE.test(id)) return fallback;
  return id;
}

export function buildRoommateMap(roommates: Roommate[]): Map<string, Roommate> {
  return new Map(roommates.map((r) => [r.id, r]));
}
