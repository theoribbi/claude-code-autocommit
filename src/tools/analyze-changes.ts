import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeChanges } from "../git/analyzer.js";

const AnalyzeChangesSchema = z.object({
  include_staged: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include staged changes in analysis"),
  include_unstaged: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include unstaged changes in analysis"),
  cwd: z
    .string()
    .optional()
    .describe("Working directory (defaults to current directory)"),
});

export function registerAnalyzeChangesTool(server: McpServer): void {
  server.tool(
    "analyze_changes",
    "Analyze git changes and return a token-efficient summary with file paths, status, additions/deletions, and suggested commit type/scope",
    AnalyzeChangesSchema.shape,
    async (params) => {
      const { include_staged, include_unstaged, cwd } = AnalyzeChangesSchema.parse(params);

      try {
        const summary = await analyzeChanges({
          includeStaged: include_staged,
          includeUnstaged: include_unstaged,
          cwd: cwd || process.cwd(),
        });

        // Format output to minimize tokens while preserving useful info
        const output = {
          files: summary.files.map((f) => ({
            path: f.path,
            status: f.status,
            changes: `+${f.additions}/-${f.deletions}`,
            ...(f.oldPath ? { oldPath: f.oldPath } : {}),
          })),
          summary: {
            totalFiles: summary.totalFiles,
            totalAdditions: summary.totalAdditions,
            totalDeletions: summary.totalDeletions,
            extensions: summary.extensions,
            directories: summary.topDirectories,
          },
          suggested: {
            type: summary.suggestedType,
            scope: summary.suggestedScope,
          },
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error analyzing changes: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
