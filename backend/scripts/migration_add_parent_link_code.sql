-- Migration: Add parent_link_code to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_link_code TEXT UNIQUE;

-- Function to generate a random 8-character uppercase string
CREATE OR REPLACE FUNCTION generate_parent_link_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    LOOP
        -- Ensure uniqueness (simplified, the trigger will handle basic cases)
        EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE parent_link_code = result);
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate parent_link_code for students on creation
CREATE OR REPLACE FUNCTION set_parent_link_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' AND NEW.parent_link_code IS NULL THEN
        NEW.parent_link_code := generate_parent_link_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_parent_link_code ON users;
CREATE TRIGGER trigger_set_parent_link_code
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION set_parent_link_code();

-- Backfill codes for existing students
UPDATE users SET parent_link_code = generate_parent_link_code() 
WHERE role = 'student' AND parent_link_code IS NULL;
