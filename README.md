# claude-code-autocommit

Generate [Conventional Commits](https://www.conventionalcommits.org/) messages from git changes in Claude Code.

**Two installation methods available:**
- **MCP Server** - Full integration with tools for analyzing changes, generating messages, and executing commits
- **Slash Command** - Lightweight `/autocommit` command that works directly in Claude Code

## Installation

### Option 1: Slash Command (Recommended for simplicity)

Install the `/autocommit` slash command:

```bash
# Install globally
npm install -g @theoribbi/claude-code-autocommit

# Add the slash command to your user commands
claude-code-autocommit-slash install

# Or install for a specific project only
claude-code-autocommit-slash install --project
```

Then use in Claude Code:
```
/autocommit              # Commit staged changes
/autocommit --all        # Stage all changes and commit
/autocommit "message"    # Commit with custom message
```

### Option 2: MCP Server (Full integration)

The MCP server provides three tools for more granular control over the commit process.

#### Using npx (recommended)

Add to your settings file (`~/.claude/settings.json` for global, or `.claude/settings.json` for project):

```json
{
  "mcpServers": {
    "autocommit": {
      "command": "npx",
      "args": ["-y", "@theoribbi/claude-code-autocommit"]
    }
  }
}
```

#### Manual installation

```bash
npm install -g @theoribbi/claude-code-autocommit
```

Then add to your settings file:

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

## Slash Command Usage

The `/autocommit` command analyzes your staged changes and generates a conventional commit message.

```
/autocommit              # Generate commit for staged changes
/autocommit --all        # Stage all changes first, then commit
/autocommit "fix typo"   # Use custom message instead of generating one
```

The command will:
1. Analyze the git diff
2. Determine the appropriate commit type (feat, fix, docs, etc.)
3. Detect the scope from directory structure
4. Generate a descriptive commit message
5. Show you the proposed message and ask for confirmation
6. Execute the commit

## MCP Server Tools

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

## Package Exports

```javascript
// MCP Server entry point
import "@theoribbi/claude-code-autocommit/mcp-server"

// Slash command installer
import "@theoribbi/claude-code-autocommit/slash-command"
```

## Uninstall Slash Command

```bash
# Remove from user commands
claude-code-autocommit-slash uninstall

# Remove from project commands
claude-code-autocommit-slash uninstall --project
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run MCP server locally
node dist/mcp/index.js

# Test slash command installer
node dist/slash-command/install.js --help
```

## License

MIT
