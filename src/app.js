import "./env.js";
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import aiRouter from "./routes/ai.js";
import authRouter from "./routes/auth.js";

const app = express();

// CORS_ORIGIN accepts several comma-separated domains, so renaming the
// frontend URL doesn't require a redeploy of the API.
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.includes("*") ? "*" : allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/ai", aiRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Express 5 forwards errors thrown in async handlers here.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.status === 429) {
    return res
      .status(429)
      .json({ error: "AI quota exhausted (rate limit or billing). See the server logs for details." });
  }
  res.status(500).json({ error: err.message });
});

export default app;
