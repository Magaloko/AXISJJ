-- 001_schema.sql — AXISJJ complete database schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles linked 1:1 to auth.users
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  date_of_birth DATE,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member', 'coach', 'owner')),
  avatar_url    TEXT,
  language      TEXT NOT NULL DEFAULT 'de'
                  CHECK (language IN ('de', 'en')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE belt_ranks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  stripes          INT  NOT NULL DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  "order"          INT  NOT NULL,
  min_time_months  INT,
  min_sessions     INT,
  color_hex        TEXT,
  UNIQUE(name, stripes)
);

CREATE TABLE profile_ranks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  belt_rank_id   UUID NOT NULL REFERENCES belt_ranks(id),
  promoted_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  promoted_by    UUID REFERENCES profiles(id),
  notes          TEXT
);

CREATE TABLE class_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  level       TEXT NOT NULL DEFAULT 'all'
                CHECK (level IN ('beginner', 'all', 'advanced', 'kids')),
  gi          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE class_sessions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_type_id      UUID NOT NULL REFERENCES class_types(id),
  coach_id           UUID REFERENCES profiles(id),
  starts_at          TIMESTAMPTZ NOT NULL,
  ends_at            TIMESTAMPTZ NOT NULL,
  capacity           INT NOT NULL DEFAULT 20,
  location           TEXT NOT NULL DEFAULT 'Strindberggasse 1, 1110 Wien',
  recurring_group_id UUID,
  cancelled          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  booked_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waitlist_position INT,
  UNIQUE(session_id, profile_id)
);

CREATE TABLE attendances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id),
  UNIQUE(session_id, profile_id)
);

CREATE TABLE skill_categories (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name    TEXT NOT NULL,
  "order" INT  NOT NULL
);

CREATE TABLE skills (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES skill_categories(id),
  name         TEXT NOT NULL,
  description  TEXT,
  video_url    TEXT,
  belt_rank_id UUID REFERENCES belt_ranks(id),
  "order"      INT  NOT NULL
);

CREATE TABLE skill_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, skill_id)
);

CREATE TABLE leads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  message    TEXT,
  source     TEXT NOT NULL DEFAULT 'website'
               CHECK (source IN ('website', 'instagram')),
  status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('waiver', 'contract')),
  signed_at   TIMESTAMPTZ,
  content_url TEXT
);
