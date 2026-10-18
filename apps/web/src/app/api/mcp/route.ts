import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer, orgFromApiKey } from "@/lib/mcp";

// Stateless MCP endpoint. Connect with: Authorization: Bearer <workspace API key>.
async function handle(req: Request) {
  const orgId = await orgFromApiKey(req.headers.get("authorization"));
  if (!orgId) return Response.json({ error: "Invalid API key." }, { status: 401 });
  const server = buildMcpServer(orgId);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
