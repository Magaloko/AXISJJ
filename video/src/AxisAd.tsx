import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { Background } from './components/Background'
import { Hero } from './sections/Hero'
import { RoleSection } from './sections/RoleSection'
import { CTA } from './sections/CTA'
import { theme } from './theme'
import {
  CalendarIcon,
  SmartphoneIcon,
  TrophyIcon,
  GraduationCapIcon,
  ZapIcon,
  ActivityIcon,
  TargetIcon,
  ClipboardIcon,
  MedalIcon,
  CheckCircleIcon,
  FileTextIcon,
  UsersIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  PaletteIcon,
  SettingsIcon,
  BarChartIcon,
  LockIcon,
} from './components/Icons'

const iconSize = 54
const iconStroke = 2.2

const memberCards = [
  { icon: <CalendarIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Training buchen', body: 'Plan einsehen und einchecken – alles in einer App.' },
  { icon: <SmartphoneIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Digitaler Pass', body: 'Gürtel, Stripes, Fortschritt – immer dabei.' },
  { icon: <TrophyIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Wettkämpfe', body: 'Events finden, anmelden, gewinnen.' },
  { icon: <GraduationCapIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Technik-Bibliothek', body: 'Curriculum und Videos auf Abruf.' },
]

const coachCards = [
  { icon: <ClipboardIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Klassen planen', body: 'Sessions, Seminare, Privates mit einem Klick.' },
  { icon: <ActivityIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Anwesenheit', body: 'Check-ins live – wer trainiert wann.' },
  { icon: <MedalIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Gürtelprüfungen', body: 'Stripes, Gürtel und Progress freigeben.' },
  { icon: <CheckCircleIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Feedback geben', body: 'Direktes Coaching für jedes Mitglied.' },
]

const ownerCards = [
  { icon: <UsersIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Mitglieder', body: 'Profile, Mitgliedschaften, Kontakte zentral.' },
  { icon: <BriefcaseIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Abos & Payments', body: 'Verträge, Rechnungen, Auto-Debit.' },
  { icon: <BarChartIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Analytics', body: 'Umsatz, Retention, Auslastung auf einen Blick.' },
  { icon: <SettingsIcon size={iconSize} strokeWidth={iconStroke} />, title: 'Branding', body: 'Logo, Farben, Texte – dein Club, dein Look.' },
]

export const AxisAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Background />

      <Sequence from={0} durationInFrames={90} name="Hero">
        <Hero />
      </Sequence>

      <Sequence from={90} durationInFrames={190} name="Member">
        <RoleSection
          role="member"
          eyebrow="Für Mitglieder"
          heading="Trainiere smarter"
          accent={theme.member}
          cards={memberCards}
        />
      </Sequence>

      <Sequence from={280} durationInFrames={190} name="Coach">
        <RoleSection
          role="coach"
          eyebrow="Für Coaches"
          heading="Führe dein Team"
          accent={theme.coach}
          cards={coachCards}
        />
      </Sequence>

      <Sequence from={470} durationInFrames={190} name="Owner">
        <RoleSection
          role="owner"
          eyebrow="Für Owner"
          heading="Dein Business"
          accent={theme.owner}
          cards={ownerCards}
        />
      </Sequence>

      <Sequence from={660} durationInFrames={240} name="CTA">
        <CTA />
      </Sequence>
    </AbsoluteFill>
  )
}
