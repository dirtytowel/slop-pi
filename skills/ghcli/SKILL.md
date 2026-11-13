---
name: ghcli
description: Use when working with GitHub pull requests from the terminal via the `gh` CLI. Trigger on "gh", "gh pr", "create a PR", "open a pull request", "review PR", "check CI on my PR".
---

# ghcli

Use `gh` for GitHub pull request work.

# rules

- Persona voice stays out of anything written to GitHub. PR titles, bodies, review comments, issue text, and commit messages carry no insults, no /g/ voice, no asides, no profanity — the persona is for talking to the user, not for artifacts other people read.
- Keep that written text casual and plain: short prose, minimal Markdown, no bullshit `## Summary` header stacks or heavy templates. Do this even when the repo uses a formal, header-heavy, super-professional style — this overrides matching the repo's tone.
- prefer `GH_PAGER=cat gh ...` so the terminal does not get wedged in a pager.
- assume auth exists; check with `gh auth status`; do not run interactive `gh auth login` unless the user asks.
- use `--json` and `--jq` for machine-readable output.
- use `--repo owner/name` when not inside the target repo.
- ask before commands that write to GitHub: create, edit, comment, review, merge, close, reopen, rerun, cancel, release, repo mutation, or mutating `gh api` calls.
- Always ask for explicit confirmation immediately before creating a PR, even if the user previously said to create one or proceed.
- use non-interactive flags like `--title`, `--body`, `--fill`, `--yes`, and `--confirm` when available.
- For PR titles and bodies, match the repo's existing PR style. Prefer simple prose over heavy Markdown templates.
- Keep PR titles short but include the reason when it fits, for example `feat(ci): output image digest for future signing`.
- Prefer short PR bodies: one or two paragraphs plus bullets only when they make the change clearer.
- Do not use generic `## Summary` / `## Validation` templates unless the repo already uses them or the user asks.
- When creating a PR, assign the authenticated `gh` user by default. Get it with `gh api user --jq .login`.
- When creating a PR, ask who should review it unless the user already specified reviewers.
- When creating a PR, request `copilot-pull-request-reviewer` as a reviewer if GitHub accepts it.

# prs

Inspect:

```bash
GH_PAGER=cat gh pr status
GH_PAGER=cat gh pr list --limit 20
GH_PAGER=cat gh pr view 123
GH_PAGER=cat gh pr diff 123
GH_PAGER=cat gh pr checks 123
```

Create:

```bash
gh pr create --fill
gh pr create --title "title" --body "body" --base main
gh pr create --draft --fill
```

Checkout:

```bash
gh pr checkout 123
```

Review/comment:

```bash
gh pr review 123 --comment --body "comment"
gh pr review 123 --approve --body "lgtm"
gh pr comment 123 --body "comment"
```

Merge:

```bash
gh pr merge 123 --squash --delete-branch
gh pr merge 123 --merge --delete-branch
gh pr merge 123 --rebase --delete-branch
```

# ci

```bash
GH_PAGER=cat gh pr checks 123
GH_PAGER=cat gh run list --limit 10
GH_PAGER=cat gh run view 1234567890
gh run watch 1234567890
```

# json

```bash
gh pr view 123 --json number,title,state,headRefName,baseRefName,url --jq .
gh pr list --json number,title,state,url --jq '.[] | [.number,.state,.title,.url] | @tsv'
```
