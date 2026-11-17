import { getDB } from '../../../lib/db.js';

export interface LocationSuggestion {
  id: string;
  name: string;
  type: 'state' | 'lga';
  state: string;
  stateId: string;
}

export interface NigeriaStateRow {
  id: string;
  name: string;
}

export interface NigeriaLgaRow {
  id: string;
  name: string;
  stateId: string;
}

interface LocationCache {
  states: NigeriaStateRow[];
  lgas: { id: string; name: string; state: string; stateId: string }[];
  loadedAt: number;
}

let cache: LocationCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * The full directory (37 states + 774 LGAs after migration 033) is tiny -
 * a few dozen KB - so it lives in process memory with a 24h TTL, exactly
 * like the suggest endpoint already did. Migrations run at boot before any
 * request is served, so the first load always sees the complete seed.
 */
async function ensureCache(): Promise<LocationCache> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache;
  const db = getDB();
  const [statesRes, lgasRes] = await Promise.all([
    db.query('SELECT id, name FROM nigeria_states ORDER BY name ASC'),
    db.query(
      `SELECT l.id, l.name, l.state_id AS "stateId", s.name AS state
       FROM nigeria_lgas l
       JOIN nigeria_states s ON s.id = l.state_id
       ORDER BY l.name ASC`
    ),
  ]);
  cache = {
    states: statesRes.rows,
    lgas: lgasRes.rows,
    loadedAt: Date.now(),
  };
  return cache;
}

export const LocationModel = {
  /** Prefix-matched suggestions, states first - all rows scanned in memory. */
  async suggest(q: string, limit = 8): Promise<LocationSuggestion[]> {
    const ql = q.trim().toLowerCase();
    if (ql.length < 2) return [];
    const c = await ensureCache();

    const states = c.states
      .filter((s) => s.name.toLowerCase().startsWith(ql))
      .slice(0, limit)
      .map((s) => ({ id: s.id, name: s.name, type: 'state' as const, state: s.name, stateId: s.id }));

    const lgas = c.lgas
      .filter((l) => l.name.toLowerCase().startsWith(ql))
      .slice(0, limit)
      .map((l) => ({ id: l.id, name: l.name, type: 'lga' as const, state: l.state, stateId: l.stateId }));

    return [...states, ...lgas];
  },

  /** Every state + FCT, alphabetical. Powers the booking/create-listing dropdowns. */
  async listStates(): Promise<NigeriaStateRow[]> {
    const c = await ensureCache();
    return c.states;
  },

  async stateExists(stateId: string): Promise<boolean> {
    const c = await ensureCache();
    return c.states.some((s) => s.id === stateId);
  },

  /** All LGAs for one state, alphabetical. Empty array for an unknown state. */
  async listLgas(stateId: string): Promise<NigeriaLgaRow[]> {
    const c = await ensureCache();
    return c.lgas
      .filter((l) => l.stateId === stateId)
      .map((l) => ({ id: l.id, name: l.name, stateId: l.stateId }));
  },
};