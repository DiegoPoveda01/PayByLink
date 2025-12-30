-- Tabla para rastrear conexiones de wallet
CREATE TABLE IF NOT EXISTS wallet_connections (
  id BIGSERIAL PRIMARY KEY,
  link_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_wallet_connections_link_id ON wallet_connections(link_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_connected_at ON wallet_connections(connected_at);

-- Política RLS
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert connections" ON wallet_connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read connections" ON wallet_connections
  FOR SELECT USING (true);
