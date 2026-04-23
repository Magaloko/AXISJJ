export type GymSport = 'bjj' | 'mma' | 'wrestling' | 'kickboxing' | 'grappling'
export type GymMode = 'public-only' | 'full'
export type GymLang = 'de' | 'en'

export interface GymConfig {
  mode: GymMode
  name: string
  sport: GymSport
  tagline: string
  logo: string
  affiliation?: string
  colors: { primary: string; secondary: string }
  defaultLanguage: GymLang
  address: string
  emailFrom: string
  social: {
    instagram: string | null
    facebook: string | null
    whatsapp: string | null
  }
  features: {
    blog: boolean
    pricing: boolean
    tournaments: boolean
    publicCoaches: boolean
    heroSlides: boolean
  }
}
