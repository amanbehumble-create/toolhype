-- Daily aggregate of AI crawler fetches (no IPs, no URLs). One row per (day, bot).
CREATE TABLE IF NOT EXISTS ai_hits (day TEXT NOT NULL, bot TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, bot));
