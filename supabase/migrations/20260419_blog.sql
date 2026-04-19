-- supabase/migrations/20260419_blog.sql
CREATE TABLE blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        UNIQUE NOT NULL,
  title            text        NOT NULL,
  excerpt          text        NOT NULL,
  body             text        NOT NULL,
  category         text        NOT NULL,
  tags             text[]      NOT NULL DEFAULT '{}',
  cover_image_url  text,
  reading_time_min int         NOT NULL DEFAULT 5,
  featured         boolean     NOT NULL DEFAULT false,
  published        boolean     NOT NULL DEFAULT false,
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "blog_posts_owner_all"
  ON blog_posts FOR ALL
  USING (get_my_role() = 'owner');
