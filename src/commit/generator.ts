import type {
  ChangesSummary,
  CommitMessage,
  CommitType,
  GenerateOptions,
} from "../git/types.js";

function generateDescription(summary: ChangesSummary): string {
  const { files, totalAdditions, totalDeletions } = summary;

  if (files.length === 0) {
    return "no changes";
  }

  // Single file - use file name
    if (files.length === 1) {
    const file = files[0];
    const fileName = file.path.split("/").pop() || file.path;
    const action = getActionVerb(file.status);
    return `${action} ${fileName}`;
  }

  // Multiple files in same directory
  const directories = new Set(files.map((f) => f.path.split("/").slice(0, -1).join("/")));
  if (directories.size === 1) {
    const dir = directories.values().next().value;
    const dirName = dir ? dir.split("/").pop() || dir : "root";
    return `update ${files.length} files in ${dirName}`;
  }

  // Describe by primary action
  const added = files.filter((f) => f.status === "A").length;
  const modified = files.filter((f) => f.status === "M").length;
  const deleted = files.filter((f) => f.status === "D").length;
  const renamed = files.filter((f) => f.status === "R").length;

  const parts: string[] = [];
  if (added > 0) parts.push(`add ${added} file${added > 1 ? "s" : ""}`);
  if (modified > 0) parts.push(`update ${modified} file${modified > 1 ? "s" : ""}`);
  if (deleted > 0) parts.push(`remove ${deleted} file${deleted > 1 ? "s" : ""}`);
  if (renamed > 0) parts.push(`rename ${renamed} file${renamed > 1 ? "s" : ""}`);

  if (parts.length === 0) {
    return `update ${files.length} files`;
  }

  return parts.join(", ");
}

function getActionVerb(status: string): string {
  switch (status) {
    case "A":
      return "add";
    case "M":
      return "update";
    case "D":
      return "remove";
    case "R":
      return "rename";
    case "C":
      return "copy";
    default:
      return "update";
  }
}

function formatCommitMessage(
  type: CommitType,
  scope: string | null,
  description: string,
  breaking: boolean
): string {
  const breakingMark = breaking ? "!" : "";
  const scopePart = scope ? `(${scope})` : "";
  return `${type}${scopePart}${breakingMark}: ${description}`;
}

export interface GenerateResult {
  message: CommitMessage;
  confidence: "high" | "medium" | "low";
}

export function generateCommitMessage(
  summary: ChangesSummary,
  options: GenerateOptions = {}
): GenerateResult {
  const type = options.type || (summary.suggestedType as CommitType) || "chore";
  const scope = options.scope !== undefined ? options.scope : summary.suggestedScope;
  const description = options.description || generateDescription(summary);
  const breaking = options.breaking || false;

  const full = formatCommitMessage(type, scope, description, breaking);

  // Calculate confidence
  let confidence: "high" | "medium" | "low" = "medium";

  if (options.type && options.description) {
    // User provided explicit values
    confidence = "high";
  } else if (summary.totalFiles === 1) {
    // Single file changes are usually clear
    confidence = "high";
  } else if (summary.totalFiles > 10) {
    // Many files - harder to auto-describe
    confidence = "low";
  } else if (summary.suggestedType !== null) {
    // Pattern matched a type
    confidence = "medium";
  }

  return {
    message: {
      type,
      scope,
      description,
      breaking,
      full,
    },
    confidence,
  };
}
