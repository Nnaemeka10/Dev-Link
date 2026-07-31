import { getDB } from '../../../lib/db.js';

export interface LocationSuggestionRow {
    id: string;
    name: string;
    type: 'state' | 'lga';
    state: string;
    state_id: string;
}

export const LocationModel = {
    /**
     * Autocomplete search across states and LGAs.
     * Uses trigram indexes for sub-millisecond fuzzy matching.
     * Returns up to 8 results — enough for a dropdown without overwhelming.
     */
    async suggest(query: string, limit = 8): Promise<LocationSuggestionRow[]> {
        const db = getDB();
        const pattern = `%${query}%`;

        const result = await db.query<LocationSuggestionRow>(
            `
            SELECT id, name, 'state'::text AS type, name AS state, id AS state_id
            FROM nigeria_states
            WHERE name ILIKE $1

            UNION ALL

            SELECT l.id, l.name, 'lga'::text AS type, s.name AS state, l.state_id
            FROM nigeria_lgas l
            JOIN nigeria_states s ON s.id = l.state_id
            WHERE l.name ILIKE $1

            ORDER BY
                -- Exact-ish matches first (name starts with query)
                CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
                name ASC
            LIMIT $3
            `,
            [pattern, `${query}%`, limit]
        );

        return result.rows;
    },
};