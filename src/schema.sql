-- Schema do CloudMart. Rode uma vez com `npm run db:init`
-- ou cole no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  price       double precision NOT NULL,
  image       text NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userEmail" text NOT NULL,
  status      text NOT NULL DEFAULT 'Pending',
  items       jsonb NOT NULL,
  total       double precision NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_email ON orders ("userEmail");

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL,
  history     jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- As tabelas são acessadas apenas pelo backend, que usa a connection string
-- direta do Postgres. RLS fica ligado para bloquear as APIs públicas do Supabase.
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
