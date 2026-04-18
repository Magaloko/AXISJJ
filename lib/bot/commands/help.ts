import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { friendlyRoleDE } from './_format'

interface CommandHelp {
  name: string
  description: string
  roles: readonly ('admin' | 'moderator' | 'coach' | 'member' | 'unlinked')[]
}

// As we add Phase 2+ commands, extend this list. For Phase 1:
const COMMAND_HELP: CommandHelp[] = [
  { name: '/start', description: 'Willkommen / Link via Deep-Link', roles: ['admin','moderator','coach','member','unlinked'] },
  { name: '/help', description: 'Diese Hilfe', roles: ['admin','moderator','coach','member','unlinked'] },
  { name: '/link', description: 'Account verkn\u00FCpfen (Magic-Code oder Telefon)', roles: ['unlinked'] },
  { name: '/me', description: 'Deine Profil-Info', roles: ['admin','moderator','coach','member'] },
  { name: '/unlink', description: 'Verkn\u00FCpfung l\u00F6sen', roles: ['admin','moderator','coach','member'] },
]

export const helpCommand: Command = {
  name: 'help',
  allowedRoles: [],
  handler: async (ctx) => {
    const visible = COMMAND_HELP.filter(c => c.roles.includes(ctx.role))
    const header = `\u{1F4D6} Verf\u00FCgbare Befehle (Rolle: ${friendlyRoleDE(ctx.role)})`
    const body = visible.map(c => `${c.name} \u2014 ${c.description}`).join('\n')
    const footer = '\nMehr Befehle kommen bald!'
    await sendMessage(ctx.chatId, `${header}\n\n${body}${footer}`)
  },
}
