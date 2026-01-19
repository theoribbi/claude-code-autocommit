# claude-code-autocommit

An MCP server that generates [Conventional Commits](https://www.conventionalcommits.org/) messages from git changes with minimal token consumption.

## Installation

### Configuration Files

Claude Code looks for MCP server configuration in these locations:

| File | Scope |
|------|-------|
| `~/.claude/settings.json` | Global (all projects) |
| `<project>/.claude/settings.json` | Project-specific |

### Using npx (recommended)

Add the following to your settings file:

**Global** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "autocommit": {
      "command": "npx",
      "args": ["-y", "claude-code-autocommit"]
    }
  }
}
```

**Or project-specific** (`.claude/settings.json` in your project root):
```json
{
  "mcpServers": {
    "autocommit": {
      "command": "npx",
      "args": ["-y", "claude-code-autocommit"]
    }
  }
}
```

### Manual installation

```bash
npm install -g claude-code-autocommit
```

Then add to your settings file (`~/.claude/settings.json` or `.claude/settings.json`):

```json
{
  "mcpServers": {
    "autocommit": {
      "command": "claude-code-autocommit"
    }
  }
}
```

> **Note**: After modifying the settings file, restart Claude Code for the changes to take effect.

## Tools

### `analyze_changes`

Analyzes git changes and returns a token-efficient summary.

**Parameters:**
- `include_staged` (boolean, default: true) - Include staged changes
- `include_unstaged` (boolean, default: false) - Include unstaged changes
- `cwd` (string, optional) - Working directory

**Returns:**
- File paths with status (A/M/D/R) and change counts
- Total additions/deletions
- File extensions and top directories
- Suggested commit type and scope

### `generate_commit_message`

Generates a Conventional Commits message based on the changes.

**Parameters:**
- `type` (string, optional) - Override commit type (feat, fix, docs, etc.)
- `scope` (string, optional) - Override scope
- `description` (string, optional) - Override description
- `breaking` (boolean, default: false) - Mark as breaking change
- `include_staged` (boolean, default: true) - Include staged changes
- `include_unstaged` (boolean, default: false) - Include unstaged changes
- `cwd` (string, optional) - Working directory

**Returns:**
- Full commit message
- Message components (type, scope, description)
- Confidence level (high/medium/low)

### `execute_commit`

Executes a git commit with the provided message.

**Parameters:**
- `message` (string, required) - The commit message
- `confirmed` (boolean, required) - Must be `true` to execute (safety check)
- `cwd` (string, optional) - Working directory

**Returns:**
- Success status
- Commit hash (on success)
- Error message (on failure)

## Type Detection Heuristics

| Pattern | Type |
|---------|------|
| `*.test.ts`, `__tests__/` | test |
| `*.md`, `docs/`, `README` | docs |
| `.github/workflows/` | ci |
| `package.json`, `tsconfig.json` | build |
| `*.css`, `.prettier*` | style |
| `.gitignore`, `*.lock` | chore |
| New files in `src/` | feat |
| Modifications | fix |

## Scope Detection

Scopes are extracted from directory structure:
- `src/auth/login.ts` → scope: `auth`
- `packages/core/` → scope: `core`
- Multiple directories → no scope

## Example Usage

```
1. Stage your changes: git add .
2. Ask Claude: "Generate a commit message for my staged changes"
3. Review the suggested message
4. Ask Claude: "Commit with that message"
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js
```

## License

MIT
