import { isOwnerLevel } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllPosts, togglePublished, deletePost } from '@/app/actions/blog-admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog | Admin' }

interface AdminPost {
  id: string
  slug: string
  title: string
  category: string
  published: boolean
  published_at: string | null
  featured: boolean
  created_at: string
}

// Wrap the server actions so the returned shape matches Next's form action
// signature (must return Promise<void>).
async function togglePublishedAction(id: string): Promise<void> {
  'use server'
  await togglePublished(id)
}

async function deletePostAction(id: string): Promise<void> {
  'use server'
  await deletePost(id)
}

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const { data: postsRaw } = await getAllPosts()
  const posts = (postsRaw ?? []) as unknown as AdminPost[]

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Blog</h1>
        <Link href="/admin/blog/new" className="bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground">
          + New Post
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <th className="pb-3 pr-4">Title</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Published</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="py-3 pr-4 font-medium">{post.title}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">{post.category}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    post.published ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                  }`}>
                    {post.published ? 'Live' : 'Draft'}
                  </span>
                  {post.featured && (
                    <span className="ml-1 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">Featured</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('de-DE') : '—'}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/blog/${post.id}/edit`} className="text-xs font-bold text-primary hover:underline">Edit</Link>
                    <form action={togglePublishedAction.bind(null, post.id)}>
                      <button type="submit" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                        {post.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <form action={deletePostAction.bind(null, post.id)}>
                      <button type="submit" className="text-xs font-bold text-destructive hover:underline">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Keine Posts. Seed-Skript ausführen oder neuen Post erstellen.</p>
        )}
      </div>
    </div>
  )
}
