import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy it from Supabase: Project Settings > Database > Connection string > Transaction pooler."
  );
}

// prepare:false is required by Supabase's transaction pooler (pgbouncer).
// Columns are quoted camelCase so rows match the JSON the frontend expects.
const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  idle_timeout: 20,
  max: Number(process.env.DB_POOL_MAX || 5),
});

export default sql;
