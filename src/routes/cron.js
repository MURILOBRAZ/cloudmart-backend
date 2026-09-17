import { Router } from "express";
import sql from "../db.js";

const router = Router();

/**
 * Keeps the Supabase project awake: the free plan pauses a project after
 * 7 days with no activity, so a Vercel cron job hits this once a day.
 * When CRON_SECRET is set, Vercel sends it as a Bearer token.
 */
router.get("/ping", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.get("authorization") !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [{ now, products }] = await sql`
    SELECT now() AS now, (SELECT COUNT(*)::int FROM products) AS products`;
  console.log(`Keep-alive ping: ${products} products at ${now.toISOString()}`);
  res.json({ status: "ok", products, database: now });
});

export default router;
