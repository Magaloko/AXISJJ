-- Fix: hero_slides RLS policy checked for role='admin' which never exists.
-- The app uses 'owner', 'coach', 'developer' — admins could not delete/hide slides.

DROP POLICY IF EXISTS "hero_slides_admin_all" ON public.hero_slides;

-- Allow owner + developer full access
CREATE POLICY "hero_slides_owner_dev_all"
  ON public.hero_slides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  );

-- Keep public read for active slides
DROP POLICY IF EXISTS "hero_slides_public_read" ON public.hero_slides;
CREATE POLICY "hero_slides_public_read"
  ON public.hero_slides
  FOR SELECT
  USING (is_active = true);

-- Owner + developer can also read inactive slides (for admin panel)
DROP POLICY IF EXISTS "hero_slides_owner_dev_read" ON public.hero_slides;
CREATE POLICY "hero_slides_owner_dev_read"
  ON public.hero_slides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  );
