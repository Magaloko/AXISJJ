import { registerCommand } from '../router'
import { startCommand } from './start'
import { helpCommand } from './help'
import { linkCommand } from './link'
import { unlinkCommand } from './unlink'
import { meCommand } from './me'
import { buchenCommand, bookCommand } from './buchen'
import { meineCommand, cancelCommand } from './meine'
import { heuteCommand } from './heute'
import { fehlenCommand } from './fehlen'
import { broadcastCommand } from './broadcast'

export function registerAllCommands(): void {
  registerCommand(startCommand)
  registerCommand(helpCommand)
  registerCommand(linkCommand)
  registerCommand(unlinkCommand)
  registerCommand(meCommand)
  registerCommand(buchenCommand)
  registerCommand(bookCommand)
  registerCommand(meineCommand)
  registerCommand(cancelCommand)
  registerCommand(heuteCommand)
  registerCommand(fehlenCommand)
  registerCommand(broadcastCommand)
}
