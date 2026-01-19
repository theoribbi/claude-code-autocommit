import { existsSync, mkdirSync, copyFileSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InstallOptions {
  scope: "user" | "project";
  force: boolean;
}

function getCommandsDir(scope: "user" | "project"): string {
  if (scope === "user") {
    return join(homedir(), ".claude", "commands");
  }
  return join(process.cwd(), ".claude", "commands");
}

function getSourceCommandPath(): string {
  // When running from dist, the command file is copied to dist/slash-command/
  const distPath = join(__dirname, "autocommit.md");
  if (existsSync(distPath)) {
    return distPath;
  }
  // Fallback for development
  return join(__dirname, "..", "..", "src", "slash-command", "autocommit.md");
}

function install(options: InstallOptions): void {
  const { scope, force } = options;
  const commandsDir = getCommandsDir(scope);
  const targetPath = join(commandsDir, "autocommit.md");
  const sourcePath = getSourceCommandPath();

  // Check if source exists
  if (!existsSync(sourcePath)) {
    console.error(`Error: Command file not found at ${sourcePath}`);
    process.exit(1);
  }

  // Create commands directory if it doesn't exist
  if (!existsSync(commandsDir)) {
    mkdirSync(commandsDir, { recursive: true });
    console.log(`Created directory: ${commandsDir}`);
  }

  // Check if command already exists
  if (existsSync(targetPath) && !force) {
    console.error(`Error: Command already exists at ${targetPath}`);
    console.error("Use --force to overwrite");
    process.exit(1);
  }

  // Copy the command file
  copyFileSync(sourcePath, targetPath);
  console.log(`Installed autocommit command to: ${targetPath}`);
  console.log("");
  console.log("Usage in Claude Code:");
  console.log("  /autocommit          - Commit staged changes");
  console.log("  /autocommit --all    - Stage all changes and commit");
  console.log('  /autocommit "msg"    - Commit with custom message');
}

function uninstall(scope: "user" | "project"): void {
  const commandsDir = getCommandsDir(scope);
  const targetPath = join(commandsDir, "autocommit.md");

  if (!existsSync(targetPath)) {
    console.log(`Command not found at ${targetPath}`);
    return;
  }

  unlinkSync(targetPath);
  console.log(`Removed autocommit command from: ${targetPath}`);
}

function showHelp(): void {
  console.log(`
claude-code-autocommit-slash - Install/uninstall the autocommit slash command

Usage:
  claude-code-autocommit-slash install [options]
  claude-code-autocommit-slash uninstall [options]

Options:
  --user      Install to ~/.claude/commands (default)
  --project   Install to ./.claude/commands (current project)
  --force     Overwrite existing command
  --help      Show this help message

Examples:
  claude-code-autocommit-slash install           # Install for current user
  claude-code-autocommit-slash install --project # Install for current project
  claude-code-autocommit-slash uninstall         # Remove from user commands
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const scope: "user" | "project" = args.includes("--project") ? "project" : "user";
  const force = args.includes("--force");

  switch (command) {
    case "install":
      install({ scope, force });
      break;
    case "uninstall":
      uninstall(scope);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
