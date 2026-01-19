---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
description: Generate and execute a Conventional Commits message based on staged changes
argument-hint: [--all | --staged] [commit message override]
---

# Autocommit - Conventional Commits Generator

You are an expert at writing clear, concise git commit messages following the Conventional Commits specification.

## Context

Get the current git state:

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Staged changes diff: !`git diff --cached --stat`
- Staged changes detail: !`git diff --cached`

## Arguments

Arguments provided: $ARGUMENTS

If `--all` is passed, stage all changes first with `git add -A`.
If `--staged` is passed or no flag, only use already staged changes.
Any other text after the flag is a commit message override.

## Instructions

1. **Analyze the changes**: Look at the staged diff to understand what was modified
2. **Determine commit type** based on the changes:
   - `feat`: New feature or functionality
   - `fix`: Bug fix
   - `docs`: Documentation only changes
   - `style`: Code style changes (formatting, semicolons, etc.)
   - `refactor`: Code refactoring without adding features or fixing bugs
   - `test`: Adding or modifying tests
   - `build`: Build system or external dependency changes
   - `ci`: CI/CD configuration changes
   - `chore`: Maintenance tasks, tooling, etc.
   - `perf`: Performance improvements
   - `revert`: Reverting a previous commit

3. **Determine scope** (optional): Extract from the primary directory or module affected

4. **Write the commit message**:
   - Format: `type(scope): description` or `type: description`
   - Description should be lowercase, imperative mood, no period at end
   - Keep it under 72 characters
   - Focus on the "why" not the "what"

5. **Show the proposed commit** to the user and ask for confirmation

6. **Execute the commit** if confirmed

## Important

- If there are no staged changes and `--all` was not passed, inform the user they need to stage changes first
- If the user provided a commit message override in the arguments, use that instead of generating one
- Always show the full commit message before executing
- Add `Co-Authored-By: Claude <noreply@anthropic.com>` to the commit message body

## Example Output

```
Based on the staged changes, I suggest:

feat(auth): add password reset functionality

This commit adds a new password reset flow with email verification.

Co-Authored-By: Claude <noreply@anthropic.com>

Shall I commit with this message?
```
