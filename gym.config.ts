import type { GymConfig } from '@/lib/gym-config'

const config: GymConfig = {
  mode: 'full',

  name: 'AXIS Jiu-Jitsu Vienna',
  sport: 'bjj',
  tagline: 'Brazilian Jiu-Jitsu in Wien.',
  logo: '/images/logo-full.png',
  colors: {
    primary: '#1a1a2e',
    secondary: '#e63946',
  },
  defaultLanguage: 'de',

  address: 'Strindberggasse 1, 1110 Wien',
  emailFrom: 'info@axisjj.at',

  social: {
    instagram: 'https://www.instagram.com/axis.jj.vienna/',
    facebook: null,
    whatsapp: null,
  },

  features: {
    blog: true,
    pricing: true,
    tournaments: true,
    publicCoaches: true,
    heroSlides: true,
  },
}

export default config
