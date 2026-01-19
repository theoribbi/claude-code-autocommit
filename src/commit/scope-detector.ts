import type { FileChange } from "../git/types.js";

function extractScope(path: string): string | null {
  const parts = path.split("/");

  // Handle monorepo patterns: packages/core/... → core
  if (parts[0] === "packages" && parts.length > 2) {
    return parts[1];
  }

  // Handle src/module/... → module
  if (parts[0] === "src" && parts.length > 2) {
    return parts[1];
  }

  // Handle lib/module/... → module
  if (parts[0] === "lib" && parts.length > 2) {
    return parts[1];
  }

  // Handle app/module/... → module
  if (parts[0] === "app" && parts.length > 2) {
    return parts[1];
  }

  // Handle components/ComponentName/... → component name in kebab-case
  if (parts[0] === "components" && parts.length > 1) {
    return toKebabCase(parts[1]);
  }

  // Handle routes or pages: pages/dashboard/... → dashboard
  if ((parts[0] === "pages" || parts[0] === "routes") && parts.length > 1) {
    return parts[1];
  }

  // Handle api routes: api/users/... → users
  if (parts[0] === "api" && parts.length > 1) {
    return parts[1];
  }

  // Handle features pattern: features/auth/... → auth
  if (parts[0] === "features" && parts.length > 1) {
    return parts[1];
  }

  // Handle modules pattern: modules/payment/... → payment
  if (parts[0] === "modules" && parts.length > 1) {
    return parts[1];
  }

  // For root-level config files, use the file name without extension
  if (parts.length === 1) {
    const match = path.match(/^\.?([a-zA-Z]+)/);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function detectScope(files: FileChange[]): string | null {
  if (files.length === 0) return null;

  // Extract scopes from all files
  const scopes = files
    .map((f) => extractScope(f.path))
    .filter((s): s is string => s !== null);

  if (scopes.length === 0) return null;

  // Count scope occurrences
  const scopeCounts = new Map<string, number>();
  for (const scope of scopes) {
    scopeCounts.set(scope, (scopeCounts.get(scope) || 0) + 1);
  }

  // If all files have the same scope, return it
  if (scopeCounts.size === 1) {
    return scopes[0];
  }

  // If one scope dominates (>70%), use it
  for (const [scope, count] of scopeCounts) {
    if (count > files.length * 0.7) {
      return scope;
    }
  }

  // Multiple scopes - return null to indicate no single scope
  return null;
}

export function extractScopeFromPath(path: string): string | null {
  return extractScope(path);
}
