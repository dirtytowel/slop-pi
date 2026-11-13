import { CustomEditor, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";

type ToolProfile = "read" | "web" | "shell" | "write";

const SEARCH_TOOLS = ["web_search", "get_search_content"];
const WEB_TOOLS = ["web_search", "source_check", "fetch_content", "get_search_content"];

const TOOLS: Record<ToolProfile, string[]> = {
	read: ["read", "grep", "find", "ls"],
	web: ["read", "grep", "find", "ls", ...SEARCH_TOOLS],
	shell: ["read", "grep", "find", "ls", "bash", ...WEB_TOOLS],
	write: ["read", "grep", "find", "ls", "bash", "edit", "write", ...WEB_TOOLS],
};
const PROFILES = Object.keys(TOOLS) as ToolProfile[];
const MODE_ENTRY = "agent-mode-state";

interface ModeState {
	mode: ToolProfile;
	enabled?: boolean;
}

class ModeEditor extends CustomEditor {
	constructor(tui: ConstructorParameters<typeof CustomEditor>[0], theme: ConstructorParameters<typeof CustomEditor>[1], keybindings: ConstructorParameters<typeof CustomEditor>[2], private readonly getModeBorderColor: () => (text: string) => string) {
		super(tui, theme, keybindings);
	}

	render(width: number): string[] {
		this.borderColor = this.getModeBorderColor();
		return super.render(width);
	}
}

export default function toolProfilesExtension(pi: ExtensionAPI): void {
	let mode: ToolProfile = "read";
	let modesEnabled = true;

	const MAX_FAILS = 2;
	const failCounts = new Map<string, number>();
	const fingerprint = (name: string, input: unknown): string => {
		try {
			return `${name}:${JSON.stringify(input)}`;
		} catch {
			return `${name}:${String(input)}`;
		}
	};

	const modeColor = (): "accent" | "warning" | "error" | "borderMuted" =>
		!modesEnabled ? "borderMuted" : mode === "write" ? "error" : mode === "shell" ? "warning" : mode === "web" ? "success" : "accent";

	function setStatus(ctx: ExtensionContext): void {
		ctx.ui.setStatus("mode", modesEnabled ? ctx.ui.theme.fg(modeColor(), `tools:${mode}`) : undefined);
	}

	function persist(): void {
		pi.appendEntry<ModeState>(MODE_ENTRY, { mode, enabled: modesEnabled });
	}

	async function applyMode(ctx: ExtensionContext, next: ToolProfile, persistState = true): Promise<void> {
		mode = next;
		modesEnabled = true;
		pi.setActiveTools(TOOLS[mode]);
		setStatus(ctx);
		if (persistState) persist();
	}

	function disableModes(ctx: ExtensionContext): void {
		modesEnabled = false;
		pi.setActiveTools(pi.getAllTools().map((t) => t.name));
		setStatus(ctx);
		persist();
		ctx.ui.notify("Tool profiles disabled. All tools active; prompt decides.", "warning");
	}

	async function cycleMode(ctx: ExtensionContext): Promise<void> {
		await applyMode(ctx, PROFILES[(PROFILES.indexOf(mode) + 1) % PROFILES.length] ?? "read");
	}

	for (const p of PROFILES) {
		pi.registerCommand(p, {
			description: `Switch to ${p} tool profile (${TOOLS[p].join(", ")})`,
			handler: async (_args, ctx) => await applyMode(ctx, p),
		});
	}

	pi.registerCommand("mode", {
		description: "Show or change tool profile: /mode read|web|shell|write|cycle|on|off|status",
		handler: async (args, ctx) => {
			const choice = args.trim().toLowerCase();
			if (!choice || choice === "status") {
				ctx.ui.notify(
					`Tool profiles: ${modesEnabled ? "enabled" : "disabled"}\nCurrent profile: ${mode}\nModel: ${ctx.model.provider}/${ctx.model.id}\nThinking: ${pi.getThinkingLevel()}\nActive tools: ${pi.getActiveTools().join(", ")}`,
					"info",
				);
			} else if (choice === "on" || choice === "enable") await applyMode(ctx, mode);
			else if (choice === "off" || choice === "disable") disableModes(ctx);
			else if (choice === "cycle" || choice === "toggle") await cycleMode(ctx);
			else if (PROFILES.includes(choice as ToolProfile)) await applyMode(ctx, choice as ToolProfile);
			else ctx.ui.notify("Usage: /mode read | web | shell | write | cycle | on | off | status", "warning");
		},
	});

	pi.registerCommand("modes", {
		description: "Toggle read/web/shell/write tool profiles on/off",
		handler: async (args, ctx) => {
			const choice = args.trim().toLowerCase();
			if (choice === "off" || choice === "disable" || (!choice && modesEnabled)) disableModes(ctx);
			else await applyMode(ctx, mode);
		},
	});

	pi.registerShortcut("tab", {
		description: "Cycle read/web/shell/write tool profile",
		handler: async (ctx) => await cycleMode(ctx),
	});

	for (const p of PROFILES) {
		pi.registerShortcut(`alt+${PROFILES.indexOf(p) + 1}`, {
			description: `Switch to ${p} tool profile`,
			handler: async (ctx) => await applyMode(ctx, p),
		});
	}

	pi.on("input", async (event, ctx) => {
		if (event.source === "extension") return { action: "continue" };
		failCounts.clear();
		if (event.text.trim() === ":q") {
			ctx.shutdown();
			return { action: "handled" };
		}
		return { action: "continue" };
	});

	pi.on("tool_call", async (event) => {
		const fp = fingerprint(event.toolName, event.input);
		if ((failCounts.get(fp) ?? 0) >= MAX_FAILS) {
			return {
				block: true,
				terminate: true,
				reason: `Retry blocked: ${event.toolName} with these exact args already failed ${MAX_FAILS}x. Stop retrying. Change approach or tell the user to fix the tool layer (/reload or elevate).`,
			};
		}
		if (!modesEnabled || TOOLS[mode].includes(event.toolName)) return;
		return {
			block: true,
			reason: `Blocked by ${mode} tool profile. Switch profiles with /mode or Tab to use ${event.toolName}.`,
		};
	});

	pi.on("before_agent_start", async (e) => (modesEnabled ? { systemPrompt: `${e.systemPrompt}\n\nActive tool profile: ${mode} (${TOOLS[mode].join(", ")})` } : undefined));

	pi.on("tool_result", async (event) => {
		const fp = fingerprint(event.toolName, event.input);
		if (event.isError) failCounts.set(fp, (failCounts.get(fp) ?? 0) + 1);
		else failCounts.delete(fp);
	});

	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new ModeEditor(tui, theme, keybindings, () => (text) => ctx.ui.theme.fg(modeColor(), text)));
		const last = ctx.sessionManager
			.getEntries()
			.filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === MODE_ENTRY)
			.pop() as { data?: ModeState } | undefined;

		mode = last?.data?.mode ?? "read";
		modesEnabled = last?.data?.enabled ?? true;
		if (modesEnabled) await applyMode(ctx, mode, false);
		else {
			pi.setActiveTools(pi.getAllTools().map((t) => t.name));
			setStatus(ctx);
		}
	});
}
