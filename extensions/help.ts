import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const HELP = `Custom
- Tab: Cycle tool profiles: read -> web -> shell -> write
- Alt+1..4: Jump to read / web / shell / write
- Shift+Tab: Cycle models
- Ctrl+P: Cycle thinking level
- Ctrl+F: Autocomplete (Tab is taken)
- Ctrl+R: Resume session
- :q: Quit

Commands
- /read: Local files only
- /web: Local read + web_search, no fetch
- /shell: bash + web tools
- /write: edit/write + web tools
- /mode status: Current mode/tools/thinking
- /modes: Toggle profiles on/off
- /hotkeys: All built-in shortcuts
- /reload: Reload extensions/config`;

export default function helpExtension(pi: ExtensionAPI): void {
	pi.registerCommand("help", {
		description: "Show custom keybinds and commands",
		handler: async (_args, ctx) => ctx.ui.notify(HELP, "info"),
	});
}
