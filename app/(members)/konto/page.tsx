import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { translations } from '@/lib/i18n'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { ProfileForm } from '@/components/members/ProfileForm'
import { LanguageToggle } from '@/components/members/LanguageToggle'
import { formatDate } from '@/lib/utils/dates'
import { PoliciesSection } from '@/components/members/PoliciesSection'
import { BotLinkCard } from '@/components/members/BotLinkCard'
import { DataPrivacySection } from '@/components/members/DataPrivacySection'
import { getGymSettings } from '@/lib/gym-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Konto' }

export default async function KontoPage() {
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)
  const t = translations[lang].konto

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const gym = await getGymSettings()

  const { data: botUser } = await supabase
    .from('bot_users')
    .select('chat_id, telegram_username')
    .eq('profile_id', user.id)
    .maybeSingle()
  const isLinked = !!botUser
  const telegramUsername = botUser?.telegram_username ?? null

  const [{ data: profile }, { data: documents }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, date_of_birth, language')
      .eq('id', user.id)
      .single(),
    supabase
      .from('documents')
      .select('type, signed_at, content_url')
      .eq('profile_id', user.id)
      .order('signed_at', { ascending: false }),
  ])

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">{t.title}</h1>

      <div className="max-w-lg space-y-8">
        {/* Profile */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.profileSection}
          </p>
          <ProfileForm profile={profile} lang={lang} />
        </section>

        {/* Language */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.languageSection}
          </p>
          <LanguageToggle current={lang} />
        </section>

        {/* Documents */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.documentsSection}
          </p>
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noDocuments}</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={`${doc.type}-${doc.signed_at}`}
                  className="flex items-center justify-between border border-border bg-card p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {doc.type === 'waiver' ? t.waiver : t.contract}
                    </p>
                    {doc.signed_at && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.signedAt} {formatDate(doc.signed_at)}
                      </p>
                    )}
                  </div>
                  {doc.content_url && (
                    <a
                      href={doc.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80"
                    >
                      {t.download}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <BotLinkCard isLinked={isLinked} telegramUsername={telegramUsername} />

        <PoliciesSection settings={gym} />

        <DataPrivacySection />
      </div>
    </div>
  )
}
