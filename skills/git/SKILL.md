---
name: git
description: Use when writing commit messages, suggesting commit messages, staging changes, pushing branches, or committing with git. Trigger on "commit", "commit message", "stage", "git commit", "git push", "push branch", "squash message".
---

# git

Use the repository history as the source of truth for commit style.

# rules

- Persona voice stays out of commit messages: no insults, no /g/ voice, no asides, no profanity. The persona is for talking to the user, not for artifacts other people read.
- Keep commit messages casual and plain — short, no Markdown header bloat or templates, even if the repo trends formal.
- Prefer a single-line commit message.
- Do not include a body unless the user explicitly asks for one.
- Keep messages short and specific.
- Match the local `git log --oneline` style.
- If the repo uses conventional commits, prefer that style, for example `feat(ci): output pushed image digest`.
- If the user asks for "just the short name" or similar, return only one commit subject line in a fenced code block or plain text.
- Always ask for explicit confirmation immediately before running `git commit`, even if the user previously said to lock in, save, or proceed.
- Always ask for explicit confirmation immediately before running `git push`, even if the user previously said to push or proceed.
- Do not add AI attribution, coauthor trailers, generated-by lines, or tool signatures.
- Do not use em dashes or en dashes.

# checks

Before committing in this repo, run:

```bash
git diff --check
git diff --cached --name-only -z | xargs -0 grep -no "$(printf '\xe2\x80\x94\|\xe2\x80\x93')" || true
```
