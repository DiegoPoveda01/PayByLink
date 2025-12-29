-- Core schema for PayByLink
-- Ejecutar en Supabase SQL editor

-- 1) Alteraciones en payment_links para soportar Tip y metadata
ALTER TABLE IF EXISTS payment_links
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS amount NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_email TEXT,
  ADD COLUMN IF NOT EXISTS completed_at BIGINT;

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_payment_links_owner_email ON payment_links(owner_email);
CREATE INDEX IF NOT EXISTS idx_payment_links_type ON payment_links(type);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON payment_links(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_links_expires_at ON payment_links(expires_at);

-- RLS mínima para permitir lectura pública solo de Tip Links
ALTER TABLE IF EXISTS payment_links ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'payment_links' AND policyname = 'Public read tip links'
  ) THEN
    CREATE POLICY "Public read tip links" ON payment_links
      FOR SELECT
      USING (type = 'tip');
  END IF;
END$$;

-- 2) Tabla invoices acorde a lib/invoices.ts
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  recipient_address TEXT NOT NULL,
  currency TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  notes TEXT,
  due_date BIGINT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  owner_business_name TEXT,
  client_name TEXT,
  client_email TEXT,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  paid_at BIGINT,
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_owner_email ON invoices(owner_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'invoices' AND policyname = 'Service role full access invoices'
  ) THEN
    CREATE POLICY "Service role full access invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 3) Webhooks y deliveries acorde a lib/webhooks.ts
CREATE TABLE IF NOT EXISTS webhooks (
  id BIGSERIAL PRIMARY KEY,
  owner_email TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_owner_email ON webhooks(owner_email);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id BIGINT REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INT,
  attempts INT,
  error TEXT,
  delivered_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'webhooks' AND policyname = 'Service role full access webhooks'
  ) THEN
    CREATE POLICY "Service role full access webhooks" ON webhooks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'webhook_deliveries' AND policyname = 'Service role full access webhook_deliveries'
  ) THEN
    CREATE POLICY "Service role full access webhook_deliveries" ON webhook_deliveries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 4) Recurring payments acorde a lib/recurring-payments.ts
CREATE TABLE IF NOT EXISTS recurring_payments (
  id TEXT PRIMARY KEY,
  recipient_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  start_date BIGINT NOT NULL,
  end_date BIGINT,
  next_payment_date BIGINT NOT NULL,
  last_payment_date BIGINT,
  total_payments INT NOT NULL,
  successful_payments INT NOT NULL,
  status TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_owner_email ON recurring_payments(owner_email);
CREATE INDEX IF NOT EXISTS idx_recurring_status ON recurring_payments(status);
CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_payments(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_recurring_created_at ON recurring_payments(created_at);

CREATE TABLE IF NOT EXISTS recurring_payment_executions (
  id BIGSERIAL PRIMARY KEY,
  recurring_id TEXT REFERENCES recurring_payments(id) ON DELETE CASCADE,
  executed_at BIGINT NOT NULL,
  success BOOLEAN NOT NULL,
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_recurring_exec_recurring_id ON recurring_payment_executions(recurring_id);
CREATE INDEX IF NOT EXISTS idx_recurring_exec_executed_at ON recurring_payment_executions(executed_at);

ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payment_executions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'recurring_payments' AND policyname = 'Service role full access recurring'
  ) THEN
    CREATE POLICY "Service role full access recurring" ON recurring_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema AND tablename = 'recurring_payment_executions' AND policyname = 'Service role full access recurring_executions'
  ) THEN
    CREATE POLICY "Service role full access recurring_executions" ON recurring_payment_executions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;
