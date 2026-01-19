import type { CommitType, FileChange } from "../git/types.js";

interface TypePattern {
  type: CommitType;
  patterns: RegExp[];
  priority: number;
}

const TYPE_PATTERNS: TypePattern[] = [
  {
    type: "test",
    patterns: [
      /\.test\.[jt]sx?$/,
      /\.spec\.[jt]sx?$/,
      /__tests__\//,
      /test\//,
      /tests\//,
      /\.cy\.[jt]sx?$/,
      /cypress\//,
    ],
    priority: 10,
  },
  {
    type: "docs",
    patterns: [
      /\.md$/i,
      /^docs\//,
      /^documentation\//,
      /^README/i,
      /CHANGELOG/i,
      /LICENSE/i,
      /\.txt$/,
    ],
    priority: 9,
  },
  {
    type: "ci",
    patterns: [
      /^\.github\/workflows\//,
      /^\.github\/actions\//,
      /^\.circleci\//,
      /^\.travis\.yml$/,
      /^\.gitlab-ci\.yml$/,
      /^Jenkinsfile$/,
      /^\.buildkite\//,
    ],
    priority: 8,
  },
  {
    type: "build",
    patterns: [
      /^package\.json$/,
      /^package-lock\.json$/,
      /^yarn\.lock$/,
      /^pnpm-lock\.yaml$/,
      /^tsconfig.*\.json$/,
      /^webpack\./,
      /^vite\.config\./,
      /^rollup\.config\./,
      /^esbuild\./,
      /^tsup\.config\./,
      /^Makefile$/,
      /^CMakeLists\.txt$/,
      /^build\./,
      /^Dockerfile$/,
      /^docker-compose/,
    ],
    priority: 7,
  },
  {
    type: "style",
    patterns: [
      /\.css$/,
      /\.scss$/,
      /\.sass$/,
      /\.less$/,
      /\.styled\.[jt]sx?$/,
      /^\.prettier/,
      /^\.eslint/,
      /^\.stylelint/,
      /^\.editorconfig$/,
    ],
    priority: 6,
  },
  {
    type: "chore",
    patterns: [
      /^\.gitignore$/,
      /^\.gitattributes$/,
      /^\.npmignore$/,
      /^\.nvmrc$/,
      /^\.node-version$/,
      /^\.env\.example$/,
      /\.lock$/,
    ],
    priority: 5,
  },
  {
    type: "perf",
    patterns: [/perf\//, /benchmark\//, /\.bench\.[jt]sx?$/],
    priority: 4,
  },
];

function matchesPattern(path: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

export function detectType(files: FileChange[]): CommitType | null {
  if (files.length === 0) return null;

  // Count matches for each type
  const typeCounts = new Map<CommitType, number>();

  for (const file of files) {
    for (const { type, patterns } of TYPE_PATTERNS) {
      if (matchesPattern(file.path, patterns)) {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        break; // Only match first pattern for each file
      }
    }
  }

  // If all files match a single type, use that
  const totalMatchedFiles = Array.from(typeCounts.values()).reduce(
    (a, b) => a + b,
    0
  );

  if (totalMatchedFiles === files.length && typeCounts.size === 1) {
    return typeCounts.keys().next().value ?? null;
  }

  // If majority of files match a type, use that
  for (const [type, count] of typeCounts) {
    if (count > files.length / 2) {
      return type;
    }
  }

  // Check for new files (feat) vs modifications (fix)
  const newFiles = files.filter((f) => f.status === "A");
  const modifiedFiles = files.filter((f) => f.status === "M");
  const deletedFiles = files.filter((f) => f.status === "D");

  // If all files are deleted, it's likely a refactor or chore
  if (deletedFiles.length === files.length) {
    return "chore";
  }

  // If mostly new files in src/, likely a feature
  const newSrcFiles = newFiles.filter(
    (f) =>
      f.path.startsWith("src/") ||
      f.path.startsWith("lib/") ||
      f.path.startsWith("app/")
  );
  if (newSrcFiles.length > files.length / 2) {
    return "feat";
  }

  // If mostly modifications, likely a fix
  if (modifiedFiles.length > files.length / 2) {
    return "fix";
  }

  // Default based on file status
  if (newFiles.length > 0) {
    return "feat";
  }

  return "fix";
}

export function detectTypeFromPath(path: string): CommitType | null {
  for (const { type, patterns } of TYPE_PATTERNS) {
    if (matchesPattern(path, patterns)) {
      return type;
    }
  }
  return null;
}
