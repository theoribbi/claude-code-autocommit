export type FileStatus = "A" | "M" | "D" | "R" | "C" | "U";

export interface FileChange {
  path: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  oldPath?: string; // For renames
}

export interface ChangesSummary {
  files: FileChange[];
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  extensions: string[];
  topDirectories: string[];
  suggestedType: string | null;
  suggestedScope: string | null;
}

export interface AnalyzeOptions {
  includeStaged?: boolean;
  includeUnstaged?: boolean;
  cwd?: string;
}

export interface CommitResult {
  success: boolean;
  commitHash?: string;
  error?: string;
}

export type CommitType =
  | "feat"
  | "fix"
  | "docs"
  | "style"
  | "refactor"
  | "test"
  | "build"
  | "ci"
  | "chore"
  | "perf"
  | "revert";

export interface CommitMessage {
  type: CommitType;
  scope: string | null;
  description: string;
  body?: string;
  breaking?: boolean;
  full: string;
}

export interface GenerateOptions {
  type?: CommitType;
  scope?: string | null;
  description?: string;
  breaking?: boolean;
}
