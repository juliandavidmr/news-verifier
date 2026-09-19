# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Repository

`juliandavidmr/news-verifier`

Infer the repository from `git remote -v`; `gh` does this automatically when run inside this clone.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`.
- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments`.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- **Close an issue**: `gh issue close <number> --comment "..."`.

Use temporary files or another shell-safe mechanism for multiline bodies rather than interpolating untrusted content into commands.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares one number space across issues and pull requests. If a bare reference such as `#42` is ambiguous, resolve it before acting.

## When a skill says “publish to the issue tracker”

Create a GitHub issue.

## When a skill says “fetch the relevant ticket”

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The map is a single issue with child issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, containing Notes, Decisions-so-far and Fog.
- **Child ticket**: a GitHub sub-issue linked to the map. If sub-issues are unavailable, add it to a task list in the map and include `Part of #<map>` in the child.
- **Blocking**: use GitHub’s native issue dependencies when available. Otherwise include `Blocked by: #<n>` in the child body.
- **Frontier**: an unassigned open child whose blockers are all closed.
- **Claim**: assign the issue to the current developer.
- **Resolve**: publish the answer, close the child and update the map’s Decisions-so-far.
