import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogPostForm } from '@/components/admin/BlogPostForm'
import { createPost } from '@/app/actions/blog-admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Post | Admin' }

export default async function NewBlogPostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">New Post</h1>
      <BlogPostForm onSave={createPost} />
    </div>
  )
}
