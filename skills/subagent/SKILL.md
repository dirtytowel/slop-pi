---
name: subagent
description: Use when delegating work to isolated pi subagents via `pi -p`, running parallel reviews, or comparing models. Trigger on "subagent", "spin up an agent", "spin up a subagent", "delegate", "fan out", "parallel agents", "pi -p", "compare models".
---

# subagent

Children are separate `pi -p` processes. The parent only reads their final answers, never transcripts.

# layout

```bash
R=/tmp/subagents/$(date +%Y%m%d-%H%M%S)-$$; mkdir -p $R
# task prompt goes in $R/task.md (children can't see this conversation; paste facts in)
```

# child command

```bash
N=~/.pi/agent/npm/node_modules
pi -p --mode json --no-session --no-extensions -e $N/pi-claude-auth [-e $N/pi-web-access] \
  --no-context-files --no-skills --no-prompt-templates --no-mcp \
  --model <provider/id> --thinking <low|off|...> --tools <allowlist> \
  @$R/task.md > $R/<name>.jsonl 2> $R/<name>.err
```

Extract the final answer, then read only that. Empty file means failure:

```bash
jq -rs '[.[]|select(.type=="message_end" and .message.role=="assistant")|.message.content[]?|select(.type=="text")|.text]|last // empty' $R/<name>.jsonl > $R/<name>.md
```

# rules

- `--no-extensions` is mandatory. `toolprofiles.ts` overrides `--tools` via `setActiveTools` and starts children in `read`. Add only the `-e` packages the child needs (claude-auth for Anthropic, web-access for web tools).
- Allowlist never exceeds the parent's profile. read: `read,grep,find,ls`. web: add `web_search,fetch_content,get_search_content`. shell: add `bash`. write only if the user asked.
- Smoke test every new model first: `... "Reply with exactly: smoke-ok"`. Confirm the id with `pi --list-models <name>`.
- Always `timeout` (180s default, 300s for local models). Thinking models look hung; check `docker exec ollama ollama ps` or logs before killing.
- Stdout and stderr go to separate files. Stderr has noise such as `Warning: No models match pattern ...`.
- Parallel: `( ... ) &` per child, then `wait`. Local ollama models: strictly one at a time, `docker exec ollama ollama stop <model>` between, and set `num_ctx` explicitly.
- Long jobs: `setsid nohup script.sh &`. Kill by process group (`kill -TERM -- -<pgid>`). Never `pkill -f 'pi -p'` from bash: it matches the calling shell and kills it.
- Prompts do not enforce read-only on weak or local models. For real read-only, wrap with `bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind $R $R --bind <cfgdir> <cfgdir> --chdir <repo>` and set `PI_CODING_AGENT_DIR=<cfgdir>` so pi's credential lock still works. Build `<cfgdir>` under `$R`: copy `models.json`, `jq 'del(.packages)' settings.json > <cfgdir>/settings.json` (otherwise pi tries `npm install` on a read-only fs and dies with EROFS), copy `auth.json` with `chmod 600` and `rm` it right after the run. Add `--offline`. A `~/.pi/settings.json.lock` EROFS warning on stderr is harmless. `--tmpfs /tmp` hides `$R` and `<cfgdir>`, so both need their own `--bind` after it.
- Local models also need a custom `PI_CODING_AGENT_DIR` copy if the model isn't in `models.json` yet. Never edit the real one.
- Never let children read `~/.pi/agent/auth.json` or print keys. Children don't spawn children.
- Read-only children cannot verify commands or flags; they will guess. Give `bash` to any child asked to check commands, or check them yourself.
- One narrow job per child, an output cap ("<400 words") and "mark verified vs guessed".
- After the run: `wc -c $R/*.md`. A zero-byte file means failure; read the `.err` file, don't summarize nothing.
- Spot-check anything load-bearing. Report agreement, disagreement, and what no child verified.

# env

`ANTHROPIC_CLI_VERSION` (currently 2.1.301, set in `~/.zshrc`) must be inherited, or newer Anthropic models return a 400 `claude_code_version_too_old`. If it recurs, the pin is stale.
