import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";

const UNDODIR = join(homedir(), ".vim/undodir");
const lua = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

export default function (pi: ExtensionAPI) {
	const before = new Map<string, { path: string; old: Buffer }>();

	const sockets = () => {
		const d = process.env.XDG_RUNTIME_DIR || `/run/user/${process.getuid?.()}`;
		let s: string[] = [];
		try { s = readdirSync(d).filter((e) => e.startsWith("nvim.")).map((e) => join(d, e)); } catch {}
		return [process.env.NVIM, process.env.PI_NVIM_SOCKET, ...s].filter((x): x is string => !!x && existsSync(x));
	};

	const loadedInNvim = async (path: string) => {
		for (const s of new Set(sockets())) {
			try {
				const r = await pi.exec("nvim", ["--server", s, "--remote-expr", `bufloaded('${path.replace(/'/g, "''")}')`], { timeout: 2000 });
				if (r.code === 0 && r.stdout.trim() === "1") return true;
			} catch {}
		}
		return false;
	};

	pi.on("tool_call", async (e, ctx) => {
		if (e.toolName !== "edit" && e.toolName !== "write") return;
		const p = String((e.input as { path?: string }).path ?? "");
		const path = resolve(ctx.cwd, p.startsWith("@") ? p.slice(1) : p);
		if (existsSync(path) && existsSync(join(UNDODIR, path.replace(/\//g, "%")))) before.set(e.toolCallId, { path, old: readFileSync(path) });
	});

	pi.on("tool_result", async (e, ctx) => {
		const b = before.get(e.toolCallId);
		before.delete(e.toolCallId);
		if (!b || e.isError) return;
		const cur = readFileSync(b.path);
		if (cur.equals(b.old) || (await loadedInNvim(b.path))) return;
		const tmp = join(tmpdir(), `pi-nvim-undo-${process.pid}-${Date.now()}`);
		try {
			writeFileSync(tmp, cur);
			writeFileSync(b.path, b.old);
			const r = await pi.exec("nvim", [
				"--clean", "--headless", "-n", "-i", "NONE",
				"--cmd", `set undofile undoreload=2147483647 undodir=${UNDODIR.replace(/[ \\]/g, "\\$&")}`,
				"-c", `lua vim.fn.writefile(vim.fn.readfile(${lua(tmp)}, 'b'), vim.fn.expand('%:p'), 'b'); vim.cmd('silent! edit!'); vim.cmd('wundo ' .. vim.fn.fnameescape(vim.fn.undofile(vim.fn.expand('%:p'))))`,
				"-c", "qa!", b.path,
			], { timeout: 10000 });
			if (r.code !== 0) throw new Error(r.stderr || `nvim exited ${r.code}`);
		} catch (err) {
			if (ctx.hasUI) ctx.ui.notify(`nvim-undo: ${err instanceof Error ? err.message : err}`, "error");
		} finally {
			if (!readFileSync(b.path).equals(cur)) writeFileSync(b.path, cur);
			try { unlinkSync(tmp); } catch {}
		}
	});
}
