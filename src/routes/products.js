import { Router } from "express";
import sql from "../db.js";
import { requireAdmin } from "../auth.js";

const router = Router();

const COLUMNS = ["id", "name", "description", "price", "image"];

function parseProduct(body) {
  const name = String(body.name ?? "").trim();
  const price = Number(body.price);
  if (!name) return { error: "name is required" };
  if (!Number.isFinite(price) || price < 0) return { error: "price must be a non-negative number" };
  return {
    product: {
      name,
      price,
      description: String(body.description ?? ""),
      image: String(body.image ?? ""),
    },
  };
}

router.get("/", async (req, res) => {
  res.json(await sql`SELECT ${sql(COLUMNS)} FROM products ORDER BY "createdAt"`);
});

router.get("/:id", async (req, res) => {
  const [product] = await sql`SELECT ${sql(COLUMNS)} FROM products WHERE id = ${req.params.id}`;
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.post("/", requireAdmin, async (req, res) => {
  const { product, error } = parseProduct(req.body);
  if (error) return res.status(400).json({ error });
  const [created] = await sql`
    INSERT INTO products ${sql(product, "name", "description", "price", "image")}
    RETURNING ${sql(COLUMNS)}`;
  res.status(201).json(created);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const { product, error } = parseProduct(req.body);
  if (error) return res.status(400).json({ error });
  const [updated] = await sql`
    UPDATE products SET ${sql(product, "name", "description", "price", "image")}
    WHERE id = ${req.params.id}
    RETURNING ${sql(COLUMNS)}`;
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json(updated);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const deleted = await sql`DELETE FROM products WHERE id = ${req.params.id} RETURNING id`;
  if (deleted.length === 0) return res.status(404).json({ error: "Product not found" });
  res.status(204).end();
});

export default router;
