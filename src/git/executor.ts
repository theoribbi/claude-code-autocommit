import { spawn } from "node:child_process";
import type { CommitResult } from "./types.js";

function runGitCommand(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number }> {
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
      resolve({ stdout, stderr, code: code ?? 1 });
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

export async function executeCommit(
  message: string,
  confirmed: boolean,
  cwd: string = process.cwd()
): Promise<CommitResult> {
  if (!confirmed) {
    return {
      success: false,
      error: "Commit not confirmed. Set confirmed=true to execute the commit.",
    };
  }

  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: "Commit message cannot be empty.",
    };
  }

  try {
    // Check if there are staged changes
    const statusResult = await runGitCommand(
      ["diff", "--cached", "--quiet"],
      cwd
    );

    if (statusResult.code === 0) {
      return {
        success: false,
        error: "No staged changes to commit.",
      };
    }

    // Execute the commit
    const commitResult = await runGitCommand(["commit", "-m", message], cwd);

    if (commitResult.code !== 0) {
      return {
        success: false,
        error: commitResult.stderr || commitResult.stdout,
      };
    }

    // Get the commit hash
    const hashResult = await runGitCommand(["rev-parse", "HEAD"], cwd);
    const commitHash = hashResult.stdout.trim();

    return {
      success: true,
      commitHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function stageFiles(
  files: string[],
  cwd: string = process.cwd()
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await runGitCommand(["add", ...files], cwd);
    if (result.code !== 0) {
      return { success: false, error: result.stderr };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
