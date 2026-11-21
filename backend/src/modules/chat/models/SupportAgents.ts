// Support agents are ordinary user accounts, declared by SUPPORT_AGENT_EMAILS.
// The env list is the single source of truth: it is reconciled into
// support_agents lazily, so editing the variable grants or revokes access with
// no code change, no migration and no admin UI.
//
// Granting makes the account a participant of every support conversation;
// revoking sets left_at, which isParticipant() already honours - so access
// disappears instantly while the messages they authored are preserved.
// There is no second access-control rule anywhere in the chat stack.

import { getDB } from '../../../lib/db.js';
import { ENV } from '../../../lib/env.js';
import type { SupportAgentView } from '../types/chat.js';

/** Reconcile at most once a minute - inbox loads must stay cheap. */
const SYNC_TTL_MS = 60_000;
let lastSyncAt = 0;
let syncInFlight: Promise<void> | null = null;

/** Parse the declarative roster. Accepts comma, semicolon or whitespace. */
function desiredEmails(): string[] {
  const raw = (ENV.SUPPORT_AGENT_EMAILS || '').trim();
  const source = raw.length > 0 ? raw : (ENV.SUPPORT_BOOTSTRAP_EMAIL || '');
  const parts = source
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0 && value.includes('@'));
  return [...new Set(parts)];
}

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
    const declared = new Set(desiredEmails());
    return res.rows.map((r: any) => ({
      user_id: Number(r.user_id),
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      avatar_url: r.avatar_url,
      created_at: r.created_at,
      is_bootstrap: declared.has(String(r.email).toLowerCase()),
    }));
  },

  /**
   * Reconcile support_agents against SUPPORT_AGENT_EMAILS.
   *
   * Name retained from the original bootstrap hook so Chat.ts needs no change:
   * findOrCreateSupportConversation calls this on inbox load.
   *
   * Safety rules:
   *  - an empty/unresolvable list is a NO-OP, never a wipe - support must never
   *    end up with zero agents because of a typo or a not-yet-created account;
   *  - unknown emails are ignored (the account has to exist first);
   *  - concurrent callers share one in-flight reconcile.
   */
  async ensureBootstrap(): Promise<void> {
    const now = Date.now();
    if (now - lastSyncAt < SYNC_TTL_MS) return;
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      try {
        const emails = desiredEmails();
        if (emails.length === 0) {
          lastSyncAt = now;
          return;
        }

        const db = getDB();
        // One parameter, so it must be $1. Referencing $2 while supplying a
        // single value left $1 unreferenced and untyped -> Postgres 42P18
        // "could not determine data type of parameter $1".
        const found = await db.query(
          `SELECT id FROM users WHERE email = ANY($1::text[]) AND is_active = TRUE`,
          [emails]
        );
        const desiredIds = found.rows.map((r: any) => Number(r.id));
        if (desiredIds.length === 0) {
          // No matching accounts yet - keep the current roster intact.
          lastSyncAt = now;
          return;
        }

        const currentIds = await this.ids();
        const desiredSet = new Set(desiredIds);
        const currentSet = new Set(currentIds);

        const toAdd = desiredIds.filter((id) => !currentSet.has(id));
        const toRemove = currentIds.filter((id) => !desiredSet.has(id));

        for (const userId of toAdd) {
          await this.add(userId, null);
        }

        // Env is authoritative, so removal bypasses the API's bootstrap guard.
        for (const userId of toRemove) {
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
            console.error('[support] failed to revoke agent', userId, error);
          } finally {
            client.release();
          }
        }

        if (toAdd.length > 0 || toRemove.length > 0) {
          console.log(
            `[support] roster synced from env: +${toAdd.length} -${toRemove.length} (total ${desiredIds.length})`
          );
        }
        lastSyncAt = Date.now();
      } catch (error) {
        // A roster problem must never break the inbox.
        console.error('[support] roster sync failed:', error);
        lastSyncAt = Date.now();
      } finally {
        syncInFlight = null;
      }
    })();

    return syncInFlight;
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
   * Revoke support via the API path. The env roster is authoritative, so an
   * account still listed in SUPPORT_AGENT_EMAILS is protected here - otherwise
   * the next sync would silently re-add it.
   */
  async remove(userId: number): Promise<void> {
    const db = getDB();
    const target = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
    if (
      target.rows.length > 0 &&
      desiredEmails().includes(String(target.rows[0].email).toLowerCase())
    ) {
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