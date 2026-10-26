CREATE TABLE IF NOT EXISTS creator_drip (seq INTEGER PRIMARY KEY, pack TEXT NOT NULL, release_date TEXT NOT NULL, handle TEXT NOT NULL UNIQUE, name TEXT NOT NULL, followers INTEGER, section TEXT, descriptor TEXT, avatar_b64 TEXT, tools TEXT);
CREATE INDEX IF NOT EXISTS idx_creator_drip_rel ON creator_drip(pack, release_date);
CREATE TABLE IF NOT EXISTS resource_signups (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, source TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')), ip_hash TEXT, synced_notion INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_signups_ip ON resource_signups(ip_hash, created_at);
