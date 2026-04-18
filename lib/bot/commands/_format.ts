export function friendlyRoleDE(role: string): string {
  switch (role) {
    case 'admin': return 'Admin · Owner'
    case 'moderator': return 'Moderator'
    case 'coach': return 'Trainer'
    case 'member': return 'Mitglied'
    default: return 'Unbekannt'
  }
}

export function formatDateDE(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'Europe/Vienna',
  })
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '') // digits only
}
