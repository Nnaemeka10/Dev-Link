import { getDB } from '../../../lib/db.js';

export interface LocationSuggestionRow {
    id: string;
    name: string;
    type: 'state' | 'lga';
    state: string;
    state_id: string;
}

export const LocationModel = {
    async suggest(query: string, limit = 8): Promise<LocationSuggestionRow[]> {
        const db = getDB();
        const pattern = `%${query}%`;
        const exactPattern = `${query}%`;

        const result = await db.query<LocationSuggestionRow>(
            `
            SELECT * FROM (
                SELECT id, name, 'state'::text AS type, name AS state, id AS state_id, (name ILIKE $2) AS is_exact
                FROM nigeria_states
                WHERE name ILIKE $1

                UNION ALL

                SELECT l.id, l.name, 'lga'::text AS type, s.name AS state, l.state_id, (l.name ILIKE $2) AS is_exact
                FROM nigeria_lgas l
                JOIN nigeria_states s ON s.id = l.state_id
                WHERE l.name ILIKE $1
            ) AS combined
            ORDER BY is_exact DESC, name ASC
            LIMIT $3
            `,
            [pattern, exactPattern, limit]
        );

        return result.rows;
    },
};