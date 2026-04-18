import type { GymSettings } from '@/lib/gym-settings'

interface Props { settings: GymSettings }

export function ContactCard({ settings }: Props) {
  const { name, address_line1, address_line2, postal_code, city, country, phone, email, website } = settings
  const mapQuery = address_line1 && city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [address_line1, address_line2, postal_code, city, country].filter(Boolean).join(', ')
      )}`
    : null

  return (
    <div className="space-y-2 text-sm">
      <p className="text-lg font-black">{name}</p>
      {address_line1 && <p>{address_line1}</p>}
      {address_line2 && <p>{address_line2}</p>}
      {(postal_code || city) && <p>{[postal_code, city].filter(Boolean).join(' ')}</p>}
      {country && <p>{country}</p>}
      <div className="space-y-1 pt-2 text-muted-foreground">
        {phone && <p>📞 <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-foreground">{phone}</a></p>}
        {email && <p>✉️ <a href={`mailto:${email}`} className="hover:text-foreground">{email}</a></p>}
        {website && <p>🌐 <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{website}</a></p>}
      </div>
      {mapQuery && (
        <a href={mapQuery} target="_blank" rel="noopener noreferrer"
           className="mt-2 inline-block text-xs font-bold text-primary hover:underline">
          Auf Google Maps anzeigen →
        </a>
      )}
    </div>
  )
}
