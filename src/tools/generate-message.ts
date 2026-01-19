import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeChanges } from "../git/analyzer.js";
import { generateCommitMessage } from "../commit/generator.js";
import type { CommitType } from "../git/types.js";

const CommitTypeEnum = z.enum([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "test",
  "build",
  "ci",
  "chore",
  "perf",
  "revert",
]);

const GenerateMessageSchema = z.object({
  type: CommitTypeEnum.optional().describe(
    "Override the commit type (feat, fix, docs, etc.)"
  ),
  scope: z
    .string()
    .nullable()
    .optional()
    .describe("Override the scope (e.g., auth, api, ui)"),
  description: z
    .string()
    .optional()
    .describe("Override the description text"),
  breaking: z
    .boolean()
    .optional()
    .default(false)
    .describe("Mark as breaking change"),
  include_staged: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include staged changes"),
  include_unstaged: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include unstaged changes"),
  cwd: z
    .string()
    .optional()
    .describe("Working directory (defaults to current directory)"),
});

export function registerGenerateMessageTool(server: McpServer): void {
  server.tool(
    "generate_commit_message",
    "Generate a Conventional Commits message based on git changes. Can auto-detect type and scope, or accept overrides.",
    GenerateMessageSchema.shape,
    async (params) => {
      const {
        type,
        scope,
        description,
        breaking,
        include_staged,
        include_unstaged,
        cwd,
      } = GenerateMessageSchema.parse(params);

      try {
        // First analyze the changes
        const summary = await analyzeChanges({
          includeStaged: include_staged,
          includeUnstaged: include_unstaged,
          cwd: cwd || process.cwd(),
        });

        if (summary.totalFiles === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "No changes found to generate commit message",
                  suggestion: "Stage some changes first with 'git add'",
                }),
              },
            ],
            isError: true,
          };
        }

        // Generate the commit message
        const result = generateCommitMessage(summary, {
          type: type as CommitType | undefined,
          scope: scope ?? undefined,
          description,
          breaking,
        });

        const output = {
          message: result.message.full,
          components: {
            type: result.message.type,
            scope: result.message.scope,
            description: result.message.description,
            breaking: result.message.breaking,
          },
          confidence: result.confidence,
          analysis: {
            totalFiles: summary.totalFiles,
            totalAdditions: summary.totalAdditions,
            totalDeletions: summary.totalDeletions,
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
              text: `Error generating commit message: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
