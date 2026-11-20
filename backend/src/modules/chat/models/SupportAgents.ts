// Support agents are ordinary user accounts. Granting the role makes them a
// participant of every support conversation; revoking it sets left_at, which
// isParticipant() already honours - so access revokes instantly with history
// intact. There is no second access-control rule anywhere in the chat stack.

import { getDB } from '../../../lib/db.js';
import { ENV } from '../../../lib/env.js';
import type { SupportAgentView } from '../types/chat.js';

export const SupportAgentModel = {
  async ids(): Promise<number[]> {
    const db = getDB();
    const res = await db.query(`SELECT user_id FROM support_agents ORDER BY created_at ASC`);
    return res.rows.map((r: any) => Number(r.user_id));
  },

  async isAgent(userId: number): Promise<boolean> {
    const db = getDB();
    const res = await db.query(`SELECT 1 FROM support_agents WHERE user_id = $1`, [userId]);
    return res.rows.length > 0;
  },

  async list(): Promise<SupportAgentView[]> {
    const db = getDB();
    const res = await db.query(
      `SELECT sa.user_id, sa.created_at, u.email, u.first_name, u.last_name, u.avatar_url
       FROM support_agents sa
       JOIN users u ON u.id = sa.user_id
       ORDER BY sa.created_at ASC`
    );
    const bootstrap = (ENV.SUPPORT_BOOTSTRAP_EMAIL || '').toLowerCase();
    return res.rows.map((r: any) => ({
      user_id: Number(r.user_id),
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      avatar_url: r.avatar_url,
      created_at: r.created_at,
      is_bootstrap: String(r.email).toLowerCase() === bootstrap,
    }));
  },

  /**
   * Idempotent. Safe to call on every inbox load: it is a single indexed
   * lookup, and only writes when the bootstrap account exists but is missing
   * from support_agents (e.g. the account was created after migration 036).
   */
  async ensureBootstrap(): Promise<void> {
    const email = (ENV.SUPPORT_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
    if (!email) return;

    const db = getDB();
    const found = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (found.rows.length === 0) return;

    const userId = Number(found.rows[0].id);
    const already = await db.query(`SELECT 1 FROM support_agents WHERE user_id = $1`, [userId]);
    if (already.rows.length > 0) return;

    await this.add(userId, null);
  },

  /** Grant support. Backfills the agent into every existing support thread. */
  async add(userId: number, addedBy: number | null): Promise<void> {
    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const target = await client.query(
        `SELECT id FROM users WHERE id = $1 AND is_active = TRUE`,
        [userId]
      );
      if (target.rows.length === 0) throw new Error('USER_NOT_FOUND');

      await client.query(
        `INSERT INTO support_agents (user_id, added_by) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, addedBy]
      );

      // Re-adding a previously removed agent clears left_at, restoring access.
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         SELECT c.id, $1, 'support' FROM conversations c WHERE c.type = 'support'
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET left_at = NULL`,
        [userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Revoke support. The agent row goes, and every support participation is
   * soft-closed. Messages they authored are preserved.
   */
  async remove(userId: number): Promise<void> {
    const email = (ENV.SUPPORT_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
    const db = getDB();

    const target = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
    if (target.rows.length > 0 && String(target.rows[0].email).toLowerCase() === email) {
      throw new Error('CANNOT_REMOVE_BOOTSTRAP');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE conversation_participants SET left_at = NOW()
         WHERE user_id = $1 AND role = 'support' AND left_at IS NULL`,
        [userId]
      );
      await client.query(`DELETE FROM support_agents WHERE user_id = $1`, [userId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
};