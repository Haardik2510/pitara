-- ══════════════════════════════════════════════════════════
-- PITARA — Supabase Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id          TEXT        PRIMARY KEY,
  email       TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  avatar_url  TEXT,
  is_admin    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SCREENINGS
CREATE TABLE IF NOT EXISTS screenings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL DEFAULT '',
  director         TEXT,
  language         TEXT        NOT NULL DEFAULT 'Hindi',
  duration_minutes INTEGER     NOT NULL DEFAULT 120,
  date             DATE        NOT NULL,
  time             TIME        NOT NULL,
  venue_name       TEXT        NOT NULL,
  venue_address    TEXT        NOT NULL DEFAULT '',
  city             TEXT        NOT NULL,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity         INTEGER     NOT NULL DEFAULT 50,
  booked_count     INTEGER     NOT NULL DEFAULT 0,
  poster_url       TEXT,
  genre            TEXT,
  is_published     BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL REFERENCES user_profiles(id),
  screening_id         UUID        NOT NULL REFERENCES screenings(id),
  booking_reference    TEXT        UNIQUE NOT NULL,
  amount_paid          NUMERIC(10,2) NOT NULL DEFAULT 0,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  razorpay_signature   TEXT,
  payment_payer_name       TEXT,
  payment_payer_email      TEXT,
  payment_transaction_id   TEXT,
  payment_notes            TEXT,
  status               TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','confirmed','cancelled','refunded')),
  phone_number         TEXT,
  attended             BOOLEAN     NOT NULL DEFAULT false,
  payment_screenshot_url TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_screenings_date      ON screenings(date);
CREATE INDEX IF NOT EXISTS idx_screenings_published ON screenings(is_published);
CREATE INDEX IF NOT EXISTS idx_bookings_user        ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_screening   ON bookings(screening_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference   ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_rzp_order   ON bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_transaction ON bookings(payment_transaction_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_payer_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_payer_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- 5. ROW LEVEL SECURITY
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe to re-run)
DROP POLICY IF EXISTS "profiles_read"    ON user_profiles;
DROP POLICY IF EXISTS "profiles_service" ON user_profiles;
DROP POLICY IF EXISTS "screenings_read"  ON screenings;
DROP POLICY IF EXISTS "screenings_svc"   ON screenings;
DROP POLICY IF EXISTS "bookings_read"    ON bookings;
DROP POLICY IF EXISTS "bookings_svc"     ON bookings;

CREATE POLICY "profiles_read_own"   ON user_profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "profiles_update_own"  ON user_profiles FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

CREATE POLICY "screenings_read"     ON screenings FOR SELECT USING (is_published = true);
CREATE POLICY "screenings_insert"   ON screenings FOR INSERT WITH CHECK (false);
CREATE POLICY "screenings_update"   ON screenings FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "screenings_delete"   ON screenings FOR DELETE USING (false);

CREATE POLICY "bookings_read_own"   ON bookings FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "bookings_insert"     ON bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "bookings_update"     ON bookings FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "bookings_delete"     ON bookings FOR DELETE USING (false);

-- 6. ATOMIC SEAT INCREMENT
CREATE OR REPLACE FUNCTION increment_booked_count(screening_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE screenings SET booked_count = booked_count + 1 WHERE id = screening_id;
END;
$$;

-- 6b. ATOMIC BOOKING RESERVATION
CREATE OR REPLACE FUNCTION reserve_booking(
  p_screening_id UUID,
  p_user_id TEXT,
  p_booking_reference TEXT,
  p_amount_paid NUMERIC,
  p_phone_number TEXT DEFAULT NULL,
  p_payment_payer_name TEXT DEFAULT NULL,
  p_payment_payer_email TEXT DEFAULT NULL,
  p_payment_transaction_id TEXT DEFAULT NULL,
  p_payment_notes TEXT DEFAULT NULL,
  p_payment_screenshot_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  screening_id UUID,
  booking_reference TEXT,
  amount_paid NUMERIC,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_payer_name TEXT,
  payment_payer_email TEXT,
  payment_transaction_id TEXT,
  payment_notes TEXT,
  status TEXT,
  phone_number TEXT,
  attended BOOLEAN,
  payment_screenshot_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_capacity INTEGER;
  v_booked   INTEGER;
  v_booking  bookings%ROWTYPE;
BEGIN
  SELECT capacity, booked_count
    INTO v_capacity, v_booked
  FROM screenings
  WHERE id = p_screening_id
    AND is_published = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Screening not found';
  END IF;

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'This screening is sold out';
  END IF;

  INSERT INTO bookings (
    user_id, screening_id, booking_reference, amount_paid, status, phone_number,
    payment_payer_name, payment_payer_email, payment_transaction_id, payment_notes,
    payment_screenshot_url
  ) VALUES (
    p_user_id, p_screening_id, p_booking_reference, p_amount_paid, 'pending', p_phone_number,
    p_payment_payer_name, p_payment_payer_email, p_payment_transaction_id, p_payment_notes,
    p_payment_screenshot_url
  )
  RETURNING * INTO v_booking;

  UPDATE screenings
    SET booked_count = booked_count + 1
    WHERE id = p_screening_id;

  RETURN QUERY
    SELECT
      b.id, b.user_id, b.screening_id, b.booking_reference,
      b.amount_paid, b.razorpay_order_id, b.razorpay_payment_id,
      b.razorpay_signature, b.payment_payer_name, b.payment_payer_email,
      b.payment_transaction_id, b.payment_notes, b.status, b.phone_number,
      b.attended, b.payment_screenshot_url, b.created_at
    FROM bookings b
    WHERE b.id = v_booking.id;
END;
$$;

-- 7. STORAGE BUCKET (run separately OR via Dashboard)
-- Dashboard → Storage → New bucket → name: "tickets" → Public: ON
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tickets', 'tickets', true) ON CONFLICT DO NOTHING;

-- Public bucket used by admin poster uploads and public film submission uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitara-assets',
  'pitara-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 8. SEED DATA (3 sample screenings)
INSERT INTO screenings (title, description, director, language, duration_minutes,
  date, time, venue_name, venue_address, city, price, capacity, is_published, genre)
VALUES
  ('Ek Raat Ka Safar',
   'A one-night road trip that asks whether two strangers can share a silence without filling it.',
   'Arjun Mehta', 'Hindi', 94,
   CURRENT_DATE + 7, '19:30:00', 'Prithvi Theatre', 'Juhu Church Road, Juhu', 'Mumbai',
   299, 60, true, 'Drama'),
  ('Khidki Waali Aurat',
   'Every morning she watches the street. The street never watches back. Until today.',
   'Priya Sharma', 'Urdu', 72,
   CURRENT_DATE + 14, '18:00:00', 'India Habitat Centre', 'Lodhi Road', 'Delhi',
   249, 80, true, 'Thriller'),
  ('Chaar Darwaze',
   'Four doors. Four families. One crumbling chawl. Zero sentimentality.',
   'Rahul Desai', 'Marathi', 108,
   CURRENT_DATE + 21, '20:00:00', 'Bal Gandharva Rang Mandir', 'FC Road', 'Pune',
   199, 100, true, 'Drama')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- FILM SUBMISSIONS  (append to existing schema)
-- ══════════════════════════════════════════════════════════

-- Submission settings (single row)
CREATE TABLE IF NOT EXISTS submission_settings (
  id                   INTEGER     PRIMARY KEY DEFAULT 1,
  submissions_enabled  BOOLEAN     NOT NULL DEFAULT false,
  fee_required         BOOLEAN     NOT NULL DEFAULT false,
  fee_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO submission_settings (id, submissions_enabled, fee_required, fee_amount)
VALUES (1, false, false, 0) ON CONFLICT DO NOTHING;

-- Film submissions
CREATE TABLE IF NOT EXISTS film_submissions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT        NOT NULL,
  runtime_minutes      INTEGER     NOT NULL DEFAULT 0,
  genres               TEXT[]      NOT NULL DEFAULT '{}',
  director_name        TEXT        NOT NULL DEFAULT '',
  writer_name          TEXT        NOT NULL DEFAULT '',
  cast_members         TEXT        NOT NULL DEFAULT '',
  release_year         INTEGER,
  synopsis             TEXT        NOT NULL DEFAULT '',
  additional_notes     TEXT        NOT NULL DEFAULT '',
  poster_url           TEXT,
  gallery_urls         TEXT[]      NOT NULL DEFAULT '{}',
  screening_link       TEXT        NOT NULL DEFAULT '',
  trailer_link         TEXT,
  submitter_name       TEXT        NOT NULL,
  submitter_email      TEXT        NOT NULL,
  submitter_phone      TEXT,
  status               TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','under_review','approved','rejected')),
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  payment_payer_name       TEXT,
  payment_payer_email      TEXT,
  payment_transaction_id   TEXT,
  payment_notes            TEXT,
  payment_screenshot_url   TEXT,
  fee_paid             NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON film_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email  ON film_submissions(submitter_email);
CREATE INDEX IF NOT EXISTS idx_submissions_rzp    ON film_submissions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_submissions_transaction ON film_submissions(payment_transaction_id);

ALTER TABLE film_submissions ADD COLUMN IF NOT EXISTS payment_payer_name TEXT;
ALTER TABLE film_submissions ADD COLUMN IF NOT EXISTS payment_payer_email TEXT;
ALTER TABLE film_submissions ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;
ALTER TABLE film_submissions ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE film_submissions ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

ALTER TABLE film_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_read"    ON film_submissions;
DROP POLICY IF EXISTS "submissions_insert"  ON film_submissions;
DROP POLICY IF EXISTS "submissions_svc"     ON film_submissions;
DROP POLICY IF EXISTS "settings_read"       ON submission_settings;
DROP POLICY IF EXISTS "settings_svc"        ON submission_settings;

CREATE POLICY "submissions_read_admin"   ON film_submissions FOR SELECT USING (false);
CREATE POLICY "submissions_insert"       ON film_submissions FOR INSERT WITH CHECK (false);
CREATE POLICY "submissions_update"       ON film_submissions FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "submissions_delete"       ON film_submissions FOR DELETE USING (false);
CREATE POLICY "settings_read_public"     ON submission_settings FOR SELECT USING (true);
CREATE POLICY "settings_update_admin"    ON submission_settings FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "settings_insert_admin"    ON submission_settings FOR INSERT WITH CHECK (false);
CREATE POLICY "settings_delete_admin"    ON submission_settings FOR DELETE USING (false);

-- Uploads use the shared public "pitara-assets" bucket created above.
-- Storage bucket for submission posters (run via Dashboard or uncomment):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT DO NOTHING;
