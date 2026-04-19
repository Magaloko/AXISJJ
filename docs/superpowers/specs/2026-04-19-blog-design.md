# BJJ Blog — Design Spec
**Date:** 2026-04-19  
**Status:** Approved

---

## Overview

A public-facing blog at `/blog` for AXIS JIU JITSU covering BJJ techniques, rules, history, belt system, competition, mindset, nutrition, no-gi, and kids BJJ. Content is stored in Supabase and seeded from existing BJJ books via an AI-powered extraction script. The admin panel gains a posts management page.

---

## Goals

- Drive organic SEO traffic to the gym's public site
- Establish AXIS JJJ as a knowledge resource for BJJ practitioners
- Launch with 20–30 polished articles seeded from existing books
- Allow the admin to create, edit, and publish posts without touching code

---

## Database Schema

Single `blog_posts` table in Supabase:

```sql
create table blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  excerpt          text not null,
  body             text not null,          -- markdown
  category         text not null,          -- see categories below
  tags             text[] not null default '{}',
  cover_image_url  text,
  reading_time_min int not null default 5,
  featured         boolean not null default false,
  published        boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);
```

**Categories (fixed enum):** `Techniques` · `Rules & Scoring` · `History` · `Belt System` · `Competition` · `Mindset` · `Nutrition` · `No-Gi` · `Kids BJJ`

**RLS:**
- Public `SELECT` where `published = true`
- Admin full CRUD via service role key

---

## Content Extraction Script

**Location:** `scripts/seed-blog.ts`  
**Run:** `npx tsx scripts/seed-blog.ts`

### Process

1. **Parse books** from `C:/Users/Mago/Downloads/AXISJJ APP/Books/`
   - PDFs: `pdf-parse`
   - EPUBs: `epub2`
   - Split text by chapter/heading boundaries into chunks (~800–1500 words each)

2. **Rewrite with Claude API** (`claude-sonnet-4-6`)  
   Each chunk is sent with a prompt instructing Claude to produce:
   - `title` — punchy blog headline
   - `excerpt` — 1–2 sentence summary
   - `body` — full markdown article with `##` sections, pull quotes as `> blockquotes`
   - `category` — auto-detected from the 9 fixed categories
   - `tags` — 2–4 relevant tags
   - `reading_time_min` — estimated from word count

3. **Deduplicate** — generate slug from title, skip if slug already exists in Supabase

4. **Seed** — insert via service role client with `published: false` (admin reviews before going live)

5. **Report** — log: `X articles created, X skipped (duplicates)`

**Books to process:**
- `Advanced Brazilian Jiu-Jitsu Techniques...pdf`
- `Brazilian Jiu Jitsu Guard Passing Drills...epub`
- `MMA Training The Ultimate Beginners Guide...pdf`
- `The beginners guide to BJJ...pdf`
- `The Minimum and Essential Brazilian Jiu Jitsu...pdf`
- `Warrior Within The Art of Brazilian Jiu-Jitsu...pdf`

---

## Public UI

### Blog Index — `/blog`

Lives in `app/(public)/blog/page.tsx` inside the existing public layout (NavBar + Footer).

**Structure:**
1. **Hero banner** — full-width red (`bg-primary`) block showing the `featured: true` post. Title, excerpt, category badge, read time, "Read Article →" CTA button.
2. **Category filter bar** — black bar with horizontal tab pills: `All | Techniques | Rules & Scoring | History | Belt System | Competition | Mindset | Nutrition | No-Gi | Kids BJJ`. Active tab highlighted red. Client-side filtering (no page reload).
3. **Post grid** — 3-col responsive grid (1-col mobile, 2-col tablet, 3-col desktop). Each card: cover image placeholder, red top border, category label, title, read time.

**Data fetching:** Server component, fetches published posts from Supabase at request time (no static generation — content updates need to be live immediately).

### Article Page — `/blog/[slug]`

Lives in `app/(public)/blog/[slug]/page.tsx`.

**Structure:**
1. **Hero header** — red banner with category, read time, publish date, title, excerpt
2. **Two-column layout:**
   - **Left (main, ~70%):** Cover image → markdown body rendered with `react-markdown` + `remark-gfm`. Sections use `##` headings with a left red border. Blockquotes styled as pull quotes. Tags rendered as black pill badges at bottom.
   - **Right (sidebar, ~30%):** "Related Posts" section (3 posts from the same category), then a "Train With Us" CTA card linking to `/trial`
3. **Breadcrumb** — `Blog → [Category] → [Title]` above the hero

**Related posts:** Fetched server-side by matching category, excluding current slug, limit 3.

**404 handling:** If slug not found or post is unpublished, return Next.js `notFound()`.

**SEO:** `generateMetadata` per article — title, description from excerpt, OG image from cover_image_url.

---

## Admin UI

### Blog Posts Page — `/admin/blog`

Added to the existing admin panel alongside the existing admin pages.

**Posts table columns:** Title · Category · Status (Draft/Live badge) · Published At · Actions (Edit, Publish/Unpublish, Delete)

**Create/Edit form fields:**
- Title (text)
- Slug (auto-generated from title, editable)
- Category (select dropdown — 9 options)
- Excerpt (textarea, max 200 chars)
- Body (markdown textarea)
- Cover Image URL (text, optional)
- Tags (comma-separated text input)
- Reading Time (number, auto-calculated but editable)
- Featured (checkbox — only one post should be featured at a time)
- Published (checkbox)

**Publish/Unpublish:** Toggle directly from the table row. Sets `published_at` to `now()` on first publish.

**Delete:** Confirmation dialog before deletion.

**Nav:** Add "Blog" link to `AdminNav.tsx`.

---

## New Dependencies

| Package | Purpose |
|---|---|
| `pdf-parse` | Extract text from PDF books |
| `epub2` | Extract text from EPUB books |
| `react-markdown` | Render markdown in article body |
| `remark-gfm` | GitHub Flavored Markdown (tables, strikethrough) |

No rich text editor — markdown only, consistent with existing codebase patterns.

---

## File Structure

```
app/(public)/blog/
  page.tsx                  ← Blog index (server component)
  [slug]/
    page.tsx                ← Article page (server component)

components/public/
  BlogHero.tsx              ← Featured post banner
  BlogCategoryFilter.tsx    ← Category tab bar (client component)
  BlogPostCard.tsx          ← Post grid card
  BlogArticleBody.tsx       ← Markdown renderer + styling
  BlogSidebar.tsx           ← Related posts + CTA

app/actions/
  blog.ts                   ← getPosts(), getPost(slug), getFeaturedPost(), getRelatedPosts()

app/(admin)/admin/blog/
  page.tsx                  ← Posts table
  new/page.tsx              ← Create post form
  [id]/edit/page.tsx        ← Edit post form

app/actions/
  blog-admin.ts             ← createPost(), updatePost(), deletePost(), togglePublished()

scripts/
  seed-blog.ts              ← AI extraction + seeding script

supabase/migrations/
  20260419_blog.sql         ← blog_posts table + RLS
```

---

## Out of Scope

- Comments or reactions on posts
- Newsletter subscription
- Full-text search
- Pagination (infinite scroll or pages) — deferred until post count justifies it
- Image upload — cover_image_url is a text field pointing to an external URL
