import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from "./mcp.js";

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || "0.0.0.0";
const MCP_PATH = "/mcp";

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

/**
 * Handles one MCP request.
 *
 * A fresh server + transport is created per request and disposed
 * afterwards. This is the stateless pattern: no session ids are issued,
 * so there is no shared state for a client to lose track of. It costs a
 * little per-request setup in exchange for far fewer connector bugs.
 */
const handleMcpRequest = async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res);
};

const requestListener = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      server: SERVER_NAME,
      version: SERVER_VERSION,
    });
  }

  if (url.pathname !== MCP_PATH) {
    return sendJson(res, 404, {
      error: "Not found",
      hint: `The MCP endpoint is ${MCP_PATH}`,
    });
  }

  try {
    await handleMcpRequest(req, res);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
};

createServer((req, res) => {
  requestListener(req, res).catch((error) => {
    console.error("Unhandled request error:", error);
  });
}).listen(PORT, HOST, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION}`);
  console.log(`MCP endpoint:  http://localhost:${PORT}${MCP_PATH}`);
  console.log(`Health check:  http://localhost:${PORT}/health`);
});
