import "../src/env.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sql from "../src/db.js";

const schema = readFileSync(new URL("../src/schema.sql", import.meta.url), "utf8");

const seedProducts = [
  {
    name: "Wireless Headphones",
    description: "Bluetooth over-ear headphones with active noise cancelling and 30h battery.",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
  {
    name: "Smart Watch",
    description: "Fitness tracking, heart rate monitor and notifications on your wrist.",
    price: 199.9,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  {
    name: "Mechanical Keyboard",
    description: "Compact 75% keyboard with hot-swappable switches and RGB backlight.",
    price: 89.5,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
  },
  {
    name: "Running Shoes",
    description: "Lightweight, breathable running shoes with cushioned sole.",
    price: 74.0,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
];

await sql.unsafe(schema);
console.log("Tables are ready.");

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM products`;
if (count === 0) {
  await sql`INSERT INTO products ${sql(seedProducts, "name", "description", "price", "image")}`;
  console.log(`Inserted ${seedProducts.length} sample products.`);
} else {
  console.log(`Catalog already has ${count} products, nothing to seed.`);
}

await sql.end();
