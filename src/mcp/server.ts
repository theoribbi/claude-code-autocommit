import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnalyzeChangesTool } from "../tools/analyze-changes.js";
import { registerGenerateMessageTool } from "../tools/generate-message.js";
import { registerExecuteCommitTool } from "../tools/execute-commit.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "claude-code-autocommit",
    version: "2.1.0",
  });

  // Register all tools
  registerAnalyzeChangesTool(server);
  registerGenerateMessageTool(server);
  registerExecuteCommitTool(server);

  return server;
}
