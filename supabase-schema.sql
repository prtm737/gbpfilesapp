-- ===================================================
-- Guwahati Biotech Park - GBP-FTMS Database Schema
-- Idempotent version - safe to run multiple times
-- ===================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'officer', 'peon', 'viewer')) DEFAULT 'viewer',
    department TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Files Master Table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('normal', 'urgent', 'immediate')) DEFAULT 'normal',
    current_holder_id UUID REFERENCES profiles(id),
    status TEXT CHECK (status IN ('active', 'in_transit', 'archived')) DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Custody Movement Chain Table (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS file_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    from_officer_id UUID REFERENCES profiles(id),
    to_officer_id UUID REFERENCES profiles(id),
    handled_by_peon_id UUID REFERENCES profiles(id),
    status TEXT CHECK (status IN ('dispatched', 'in_transit', 'received')) NOT NULL,
    remarks TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance (skip if exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_status') THEN
        CREATE INDEX idx_files_status ON files(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_department') THEN
        CREATE INDEX idx_files_department ON files(department);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_current_holder') THEN
        CREATE INDEX idx_files_current_holder ON files(current_holder_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_file_movements_file_id') THEN
        CREATE INDEX idx_file_movements_file_id ON file_movements(file_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_file_movements_timestamp') THEN
        CREATE INDEX idx_file_movements_timestamp ON file_movements(timestamp DESC);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated update profiles" ON profiles;
CREATE POLICY "Allow authenticated read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert profiles" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update profiles" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read files" ON files;
DROP POLICY IF EXISTS "Allow authenticated insert files" ON files;
DROP POLICY IF EXISTS "Allow authenticated update files" ON files;
CREATE POLICY "Allow authenticated read files" ON files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert files" ON files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update files" ON files FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read movements" ON file_movements;
DROP POLICY IF EXISTS "Allow authenticated insert movements" ON file_movements;
CREATE POLICY "Allow authenticated read movements" ON file_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert movements" ON file_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, department)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'), NEW.raw_user_meta_data->>'department');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();