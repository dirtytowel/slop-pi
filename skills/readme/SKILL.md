---
name: readme
description: Use when creating or rewriting README.md files in the fzmedia-inspired lowercase, terse, practical format.
---

# readme

Write README.md files in the fzmedia style: plain, useful, lowercase, and allergic to corporate slop.

# format

- start with a raw one-line project description, not a `# title`
- use lowercase `#` headers
- include only sections that actually apply
- prefer this order:
  - one-line description
  - `# how to install`
  - `# how it works`
  - `# how to use/configure`
  - `# dependencies`
  - `# I found a bug/issue, what do I do?`
  - `# TODO`
- skip empty or forced sections
- no badges
- no tables unless they clearly beat a list
- no screenshots unless the project is visual
- no marketing copy
- no emoji

# tone

- casual but clean
- terse and practical
- explain what it does, how to run it, and where the knobs are
- write like the reader already knows how computers work
- be honest about rough edges and limitations
- use examples instead of abstract feature lists
- avoid hype words like seamless, powerful, robust, enterprise, scalable, delightful

# code and examples

- use inline code for commands, paths, flags, env vars, and config keys
- use `bash` fenced blocks for shell commands and config snippets
- use plain fenced blocks for CLI help output
- use language-specific fenced blocks for API examples
- include actual `-h` output for CLI tools when available
- use ASCII trees for file layouts when helpful
- link only to useful external references

# section rules

`# how to install` goes in if the project has an install step. keep it short.

`# how it works` should explain the flow in one or two paragraphs. pipelines are good, like `${INPUT} -> ${TOOL} -> ${OUTPUT}`.

`# how to use/configure` covers commands, flags, config files, env vars, and practical examples. for libraries, use `# how to use` or `# api` instead.

`# dependencies` only appears when dependencies are not obvious from install instructions.

`# I found a bug/issue, what do I do?` should be one short paragraph telling people to open an issue or PR.

`# TODO` is a simple bullet list of real future work. omit it if there is no TODO.

# reference shape

```markdown
small one-line description of what the thing does and why it exists

# how to install

install with `some command`

uninstall with `some other command`

# how it works

short explanation of the moving parts.

`${INPUT} -> ${PROGRAM} -> ${OUTPUT}`

INPUT: where data comes from

PROGRAM: what handles it

OUTPUT: what gets produced

# how to use/configure

config lives at `~/.config/tool/config` and is created if missing.

```bash
THING="value" #default
OTHER_THING="another value"
```

you can run it with `tool`. `tool -h` prints:

```
Usage: tool [-f FILE] [-h]

  -f  file to process
  -h  this help
```

real examples go here, inline with the explanation.

# I found a bug/issue, what do I do?

open an issue or PR. include what you ran, what happened, and what you expected.

# TODO

- real future thing
- another real future thing
```
