import { spawn } from "node:child_process";
import type {
  AnalyzeOptions,
  ChangesSummary,
  FileChange,
  FileStatus,
} from "./types.js";
import { detectType } from "../commit/type-detector.js";
import { detectScope } from "../commit/scope-detector.js";

function runGitCommand(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("git", args, { cwd });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Git command failed: ${stderr || stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

function parseNumstat(output: string): Map<string, { add: number; del: number }> {
  const stats = new Map<string, { add: number; del: number }>();
  if (!output.trim()) return stats;

  const lines = output.trim().split("\n");
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 3) {
      const [addStr, delStr, ...pathParts] = parts;
      const path = pathParts.join("\t");
      const add = addStr === "-" ? 0 : parseInt(addStr, 10);
      const del = delStr === "-" ? 0 : parseInt(delStr, 10);
      stats.set(path, { add, del });
    }
  }
  return stats;
}

function parseNameStatus(output: string): Map<string, { status: FileStatus; oldPath?: string }> {
  const statuses = new Map<string, { status: FileStatus; oldPath?: string }>();
  if (!output.trim()) return statuses;

  const lines = output.trim().split("\n");
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const statusCode = parts[0].charAt(0) as FileStatus;
      if (parts[0].startsWith("R") || parts[0].startsWith("C")) {
        // Rename or copy: status\told_path\tnew_path
        const oldPath = parts[1];
        const newPath = parts[2];
        statuses.set(newPath, { status: statusCode, oldPath });
      } else {
        statuses.set(parts[1], { status: statusCode });
      }
    }
  }
  return statuses;
}

function getExtension(path: string): string {
  const match = path.match(/\.([^./]+)$/);
  return match ? match[1] : "";
}

function getTopDirectory(path: string): string {
  const parts = path.split("/");
  return parts.length > 1 ? parts[0] : "";
}

export async function analyzeChanges(
  options: AnalyzeOptions = {}
): Promise<ChangesSummary> {
  const {
    includeStaged = true,
    includeUnstaged = false,
    cwd = process.cwd(),
  } = options;

  const files: FileChange[] = [];
  const extensionSet = new Set<string>();
  const directorySet = new Set<string>();

  // Build git diff arguments
  const baseArgs = includeStaged && !includeUnstaged ? ["--cached"] : [];
  if (!includeStaged && includeUnstaged) {
    // Only unstaged changes (no --cached)
  } else if (includeStaged && includeUnstaged) {
    // Include both: use HEAD
    baseArgs.length = 0;
    baseArgs.push("HEAD");
  }

  // Run both commands in parallel for efficiency
  const [numstatResult, nameStatusResult] = await Promise.all([
    runGitCommand(["diff", ...baseArgs, "--numstat"], cwd),
    runGitCommand(["diff", ...baseArgs, "--name-status"], cwd),
  ]);

  const numstatMap = parseNumstat(numstatResult.stdout);
  const nameStatusMap = parseNameStatus(nameStatusResult.stdout);

  // Merge the data
  for (const [path, { status, oldPath }] of nameStatusMap) {
    const stats = numstatMap.get(path) || numstatMap.get(oldPath || "") || { add: 0, del: 0 };

    const fileChange: FileChange = {
      path,
      status,
      additions: stats.add,
      deletions: stats.del,
    };

    if (oldPath) {
      fileChange.oldPath = oldPath;
    }

    files.push(fileChange);

    const ext = getExtension(path);
    if (ext) extensionSet.add(ext);

    const dir = getTopDirectory(path);
    if (dir) directorySet.add(dir);
  }

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  const suggestedType = detectType(files);
  const suggestedScope = detectScope(files);

  return {
    files,
    totalFiles: files.length,
    totalAdditions,
    totalDeletions,
    extensions: Array.from(extensionSet),
    topDirectories: Array.from(directorySet),
    suggestedType,
    suggestedScope,
  };
}
