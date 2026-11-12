/**
 * The work that the site does by itself.
 *
 * The cleaning of the table of the events runs every day, so the table
 * stays small and the numbers on the screen stay quick to work out.
 */
import { db } from '../db/db.js';

/**
 * Register the routes on the app.
 * @param {import('express').Express} app
 */
export function registerCronRoutes(app) {
  const isAllowed = (req) => {
    // The scheduler of the site sends the secret with the request.
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    return given.length > 0 && given === secret;
  };

  app.get('/api/cron/clean-events', async (req, res) => {
    if (!isAllowed(req)) {
      return res.status(401).json({ error: 'Not allowed' });
    }

    const days = Number(process.env.ANALYTICS_RETENTION_DAYS || 180);
    const removed = await db.cleanOldEvents(days);

    console.log(`[Cron] ${removed} old events taken away (the last ${days} days are kept)`);
    res.json({ success: true, removed, days });
  });
}
