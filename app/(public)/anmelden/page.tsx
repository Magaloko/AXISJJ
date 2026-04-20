import type { Metadata } from 'next'
import MembershipForm from './MembershipForm'

export const metadata: Metadata = {
  title: 'Mitglied werden | AXIS Jiu-Jitsu Vienna',
  description: 'Jetzt Mitglied werden bei AXIS Jiu-Jitsu Vienna. Online anmelden oder Vertrag als PDF herunterladen.',
}

export default function AnmeldenPage() {
  return <MembershipForm />
}
