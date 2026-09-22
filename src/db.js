import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy the pooled connection string from Neon: Project Dashboard > Connect (Connection pooling on)."
  );
}

// prepare:false keeps queries safe behind Neon's pooled endpoint (PgBouncer in transaction mode).
// Columns are quoted camelCase so rows match the JSON the frontend expects.
const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  idle_timeout: 20,
  max: Number(process.env.DB_POOL_MAX || 5),
});

export default sql;
