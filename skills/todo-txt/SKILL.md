---
name: todo-txt
description: Use when managing todo.txt tasks with todo.sh/todo.txt-cli, configuring todo.txt locations, adding/listing/completing tasks, or working with per-directory todo.txt files. Trigger on "todo", "todo.sh", "todo.txt", "task", "tasks", "add todo", "done todo".
---

# todo-txt

Use `todo.sh` for todo.txt task management.

# rules

- Prefer the user's real config at `~/.todo/config`.
- Do not edit `~/.todo.cfg` unless the user explicitly asks; that is not the active config on this machine.
- Use `todo.sh -d "$HOME/.todo/config" ...` when running commands non-interactively so config ambiguity does not bite you.
- This machine is configured to prefer `./todo.txt` when it exists in the current directory.
- If `./todo.txt` does not exist, the configured fallback is `~/.todo.txt` with completed tasks in `~/done.txt`.
- `REPORT_FILE` is intentionally left at `$TODO_DIR/.todo/report.txt`.
- New tasks should not get creation-date prefixes; keep `export TODOTXT_DATE_ON_ADD=0`.
- Before changing paths, inspect `~/.todo/config` and preserve existing colors/preferences.
- Ask before deleting or archiving tasks unless the user gave a direct delete/archive instruction.
- When adding tasks, preserve the user's wording exactly unless they ask for normalization.

# current config behavior

Expected file-location block in `~/.todo/config`:

```sh
export TODO_DIR=${HOME:-$USERPROFILE}

if [ -f "$PWD/todo.txt" ]; then
    export TODO_FILE="$PWD/todo.txt"
    export DONE_FILE="$PWD/done.txt"
else
    export TODO_FILE="$HOME/.todo.txt"
    export DONE_FILE="$HOME/done.txt"
fi
export REPORT_FILE="$TODO_DIR/.todo/report.txt"
export TODOTXT_DATE_ON_ADD=0
```

# common commands

List tasks:

```bash
todo.sh -d "$HOME/.todo/config" ls
```

Add a task:

```bash
todo.sh -d "$HOME/.todo/config" add "task text +project @context"
```

Mark done:

```bash
todo.sh -d "$HOME/.todo/config" do NUMBER
```

Delete task:

```bash
todo.sh -d "$HOME/.todo/config" del NUMBER
```

Prioritize:

```bash
todo.sh -d "$HOME/.todo/config" pri NUMBER A
```

Remove priority:

```bash
todo.sh -d "$HOME/.todo/config" depri NUMBER
```

Append/prepend:

```bash
todo.sh -d "$HOME/.todo/config" append NUMBER "extra text"
todo.sh -d "$HOME/.todo/config" prepend NUMBER "prefix text"
```

# per-directory workflow

To make a directory use local tasks:

```bash
cd /some/project
: > todo.txt
todo.sh -d "$HOME/.todo/config" add "first project-local task"
```

If `todo.txt` is absent in the current directory, commands use the home fallback instead.

# checks

Check which file will be used from the current directory:

```bash
if [ -f "$PWD/todo.txt" ]; then
  echo "$PWD/todo.txt"
else
  echo "$HOME/.todo.txt"
fi
```

Verify config exists:

```bash
test -f "$HOME/.todo/config" && echo ok
```
