-- Add image_url to class_types
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS image_url text;

-- Storage bucket for class type images (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-type-images',
  'class-type-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for storage
CREATE POLICY "class_type_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'class-type-images');

-- Owner upload policy
CREATE POLICY "class_type_images_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'class-type-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owner delete policy
CREATE POLICY "class_type_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'class-type-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
