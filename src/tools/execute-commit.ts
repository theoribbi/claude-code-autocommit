import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeCommit } from "../git/executor.js";

const ExecuteCommitSchema = z.object({
  message: z.string().min(1).describe("The commit message to use"),
  confirmed: z
    .boolean()
    .describe("Must be true to execute the commit (safety check)"),
  cwd: z
    .string()
    .optional()
    .describe("Working directory (defaults to current directory)"),
});

export function registerExecuteCommitTool(server: McpServer): void {
  server.tool(
    "execute_commit",
    "Execute a git commit with the provided message. Requires confirmed=true as a safety measure.",
    ExecuteCommitSchema.shape,
    async (params) => {
      const { message, confirmed, cwd } = ExecuteCommitSchema.parse(params);

      try {
        const result = await executeCommit(
          message,
          confirmed,
          cwd || process.cwd()
        );

        if (result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  commitHash: result.commitHash,
                  message: message,
                }),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: result.error,
                }),
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error executing commit: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
