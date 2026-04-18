import { registerCommand } from '../router'
import { startCommand } from './start'
import { helpCommand } from './help'
import { linkCommand } from './link'
import { unlinkCommand } from './unlink'
import { meCommand } from './me'

export function registerAllCommands(): void {
  registerCommand(startCommand)
  registerCommand(helpCommand)
  registerCommand(linkCommand)
  registerCommand(unlinkCommand)
  registerCommand(meCommand)
}
