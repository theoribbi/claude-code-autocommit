---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
description: Generate and execute a Conventional Commits message based on staged changes
argument-hint: [--all] [--confirm] [message]
---

# Autocommit

Generate a Conventional Commits message and commit immediately.

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Staged: !`git diff --cached --stat`
- Diff: !`git diff --cached`

## Arguments

Args: $ARGUMENTS

- `--all` or `-a`: Stage all changes first with `git add -A`
- `--confirm` or `-c`: Ask for confirmation before committing
- Any other text: Use as commit message override

## Instructions

1. If no staged changes and `--all` not passed, inform user and stop
2. If message override provided, use it directly
3. Otherwise, analyze diff and generate message:
   - Type: `feat|fix|docs|style|refactor|test|build|ci|chore|perf|revert`
   - Format: `type(scope): description` (lowercase, imperative, no period, <72 chars)
4. **Commit immediately** (unless `--confirm` flag is set)
5. Show the commit hash and message after committing

## Output

Keep output minimal. After committing, just show:
```
✓ <hash> <commit message>
```
