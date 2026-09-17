import { Router } from "express";
import sql from "../db.js";
import { requireAdmin } from "../auth.js";

const router = Router();

const COLUMNS = ["id", "userEmail", "status", "items", "total", "createdAt"];

router.get("/", requireAdmin, async (req, res) => {
  res.json(await sql`SELECT ${sql(COLUMNS)} FROM orders ORDER BY "createdAt" DESC`);
});

// Declared before "/:id" so "user" is not treated as an order id.
router.get("/user", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query parameter is required" });
  res.json(await sql`
    SELECT ${sql(COLUMNS)} FROM orders WHERE "userEmail" = ${String(email)}
    ORDER BY "createdAt" DESC`);
});

router.get("/:id", requireAdmin, async (req, res) => {
  const [order] = await sql`SELECT ${sql(COLUMNS)} FROM orders WHERE id = ${req.params.id}`;
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

router.post("/", async (req, res) => {
  const { userEmail, items, status = "Pending" } = req.body;
  if (!userEmail) return res.status(400).json({ error: "userEmail is required" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }
  const total = Number(
    req.body.total ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const [created] = await sql`
    INSERT INTO orders ("userEmail", status, items, total, "createdAt")
    VALUES (${String(userEmail)}, ${String(status)}, ${sql.json(items)}, ${total},
            ${req.body.createdAt || new Date().toISOString()})
    RETURNING ${sql(COLUMNS)}`;
  res.status(201).json(created);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status is required" });
  const [updated] = await sql`
    UPDATE orders SET status = ${String(status)} WHERE id = ${req.params.id}
    RETURNING ${sql(COLUMNS)}`;
  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json(updated);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const deleted = await sql`DELETE FROM orders WHERE id = ${req.params.id} RETURNING id`;
  if (deleted.length === 0) return res.status(404).json({ error: "Order not found" });
  res.status(204).end();
});

export default router;
