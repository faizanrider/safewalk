-- ═══════════════════════════════════════════════════════
-- SafeWalk Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Emergency Contacts ───────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_user ON emergency_contacts(user_id);

-- ── SOS Events ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'triggered',
    contacts_notified INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_sos_user ON sos_events(user_id);
CREATE INDEX idx_sos_created ON sos_events(created_at DESC);

-- ── Location History ─────────────────────────────────
CREATE TABLE IF NOT EXISTS location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_user ON location_history(user_id);
CREATE INDEX idx_location_time ON location_history(recorded_at DESC);

-- ── Safety Reports ───────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_location ON safety_reports(latitude, longitude);

-- ── Safety Zones (pre-defined by admins) ─────────────
CREATE TABLE IF NOT EXISTS safety_zones (
    zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER DEFAULT 500,
    safety_level TEXT NOT NULL CHECK (safety_level IN ('safe', 'normal', 'unsafe')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_level ON safety_zones(safety_level);

-- ── Row Level Security ───────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own contacts" ON emergency_contacts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own SOS events" ON sos_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own location" ON location_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all safety reports" ON safety_reports
    FOR SELECT USING (true);

CREATE POLICY "Users can create safety reports" ON safety_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Safety zones are publicly readable
ALTER TABLE safety_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read safety zones" ON safety_zones
    FOR SELECT USING (true);
