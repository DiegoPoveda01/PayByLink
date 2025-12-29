-- Crear tabla para analíticas de vistas de enlaces
CREATE TABLE IF NOT EXISTS payment_link_views (
  id BIGSERIAL PRIMARY KEY,
  link_id TEXT NOT NULL,
  viewed_at BIGINT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  os TEXT,
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_payment_link_views_link_id ON payment_link_views(link_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_views_viewed_at ON payment_link_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_payment_link_views_device_type ON payment_link_views(device_type);

-- Política RLS: permitir inserción desde cualquier origen (vía Service Role en API)
ALTER TABLE payment_link_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert views" ON payment_link_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read views" ON payment_link_views
  FOR SELECT
  USING (true);
