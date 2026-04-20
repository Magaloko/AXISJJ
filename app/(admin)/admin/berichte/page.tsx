// components/admin/berichte/page.tsx
// Stub: Sidebar-Link zeigt auf /admin/berichte.
// Solange es keine Listen-Seite gibt, leiten wir direkt auf /neu weiter.
// Sobald die echte Übersicht existiert, kann dieser Redirect entfernt werden.

import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Berichte',
}

export default function BerichteIndexPage() {
    redirect('/admin/berichte/neu')
}
