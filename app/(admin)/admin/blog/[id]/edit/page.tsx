import { isOwnerLevel } from '@/lib/auth/roles'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogPostForm } from '@/components/admin/BlogPostForm'
import { updatePost, getPostById } from '@/app/actions/blog-admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Post | Admin' }

interface Props { params: Promise<{ id: string }> }

export default async function EditBlogPostPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Edit Post</h1>
      <BlogPostForm
        initial={{ ...post, id }}
        onSave={input => updatePost(id, input)}
      />
    </div>
  )
}
