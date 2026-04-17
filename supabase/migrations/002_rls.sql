-- 002_rls.sql — Row Level Security policies
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_ranks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_ranks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_coach" ON profiles FOR SELECT USING (get_my_role() IN ('coach', 'owner'));

-- BELT_RANKS — public read
CREATE POLICY "belt_ranks_public_read" ON belt_ranks FOR SELECT USING (TRUE);
CREATE POLICY "belt_ranks_owner_all"   ON belt_ranks FOR ALL USING (get_my_role() = 'owner');

-- PROFILE_RANKS
CREATE POLICY "profile_ranks_select_own"   ON profile_ranks FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "profile_ranks_select_coach" ON profile_ranks FOR SELECT USING (get_my_role() IN ('coach', 'owner'));
CREATE POLICY "profile_ranks_insert_coach" ON profile_ranks FOR INSERT WITH CHECK (get_my_role() IN ('coach', 'owner'));

-- CLASS_TYPES — public read
CREATE POLICY "class_types_public_read" ON class_types FOR SELECT USING (TRUE);
CREATE POLICY "class_types_coach_all"   ON class_types FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- CLASS_SESSIONS — public read for schedule widget
CREATE POLICY "class_sessions_public_read" ON class_sessions FOR SELECT USING (TRUE);
CREATE POLICY "class_sessions_coach_all"   ON class_sessions FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- BOOKINGS
CREATE POLICY "bookings_select_own"   ON bookings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "bookings_insert_own"   ON bookings FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "bookings_update_own"   ON bookings FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "bookings_select_coach" ON bookings FOR SELECT USING (get_my_role() IN ('coach', 'owner'));
CREATE POLICY "bookings_update_coach" ON bookings FOR UPDATE USING (get_my_role() IN ('coach', 'owner'));

-- ATTENDANCES
CREATE POLICY "attendances_select_own" ON attendances FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "attendances_coach_all"  ON attendances FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- SKILL_CATEGORIES — public read
CREATE POLICY "skill_categories_public_read" ON skill_categories FOR SELECT USING (TRUE);
CREATE POLICY "skill_categories_owner_all"   ON skill_categories FOR ALL USING (get_my_role() = 'owner');

-- SKILLS — public read
CREATE POLICY "skills_public_read" ON skills FOR SELECT USING (TRUE);
CREATE POLICY "skills_owner_all"   ON skills FOR ALL USING (get_my_role() = 'owner');

-- SKILL_PROGRESS
CREATE POLICY "skill_progress_own_all"    ON skill_progress FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "skill_progress_coach_read" ON skill_progress FOR SELECT USING (get_my_role() IN ('coach', 'owner'));

-- LEADS — public insert (trial form), coaches manage
CREATE POLICY "leads_public_insert" ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "leads_coach_all"     ON leads FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- DOCUMENTS
CREATE POLICY "documents_select_own" ON documents FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "documents_coach_all"  ON documents FOR ALL USING (get_my_role() IN ('coach', 'owner'));
