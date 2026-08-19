import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findSkillById, loadSkills, searchSkills } from "./skills.js";

export const SERVER_NAME = "hector-mcp-plugin-test";
export const SERVER_VERSION = "0.1.0";

const asText = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
});

const asError = (message) => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

/**
 * Builds the MCP server and its tool surface.
 *
 * The three tools are deliberate: `ping` proves the transport works,
 * while `search` + `fetch` are the names ChatGPT's connector flow looks
 * for. Skills are exposed through tools rather than MCP prompts because
 * ChatGPT only consumes tools -- prompts would be invisible there.
 */
export const createMcpServer = () => {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description:
        "Connectivity check. Echoes a message back with a server timestamp. " +
        "Use this to confirm the Hector MCP plugin is reachable.",
      inputSchema: {
        message: z
          .string()
          .optional()
          .describe("Optional message to echo back."),
      },
    },
    async ({ message }) =>
      asText({
        ok: true,
        server: SERVER_NAME,
        version: SERVER_VERSION,
        echo: message ?? "pong",
        timestamp: new Date().toISOString(),
      }),
  );

  server.registerTool(
    "search",
    {
      title: "Search skills",
      description:
        "Search available Hector skills by keyword. Returns matching skill " +
        "ids and titles. Call with an empty query to list every skill. " +
        "Use `fetch` to retrieve the full text of a result.",
      inputSchema: {
        query: z
          .string()
          .default("")
          .describe("Keyword to match against skill id, title, description."),
      },
    },
    async ({ query }) => {
      try {
        const skills = await loadSkills();
        const matches = searchSkills(skills, query ?? "");
        return asText({
          results: matches.map(({ id, title, description }) => ({
            id,
            title,
            description,
          })),
        });
      } catch (error) {
        return asError(`Failed to search skills: ${error.message}`);
      }
    },
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch skill",
      description:
        "Retrieve the full markdown body of one Hector skill by its id. " +
        "Ids come from the `search` tool.",
      inputSchema: {
        id: z.string().describe("The skill id, e.g. 'hello-hector'."),
      },
    },
    async ({ id }) => {
      try {
        const skills = await loadSkills();
        const skill = findSkillById(skills, id);
        if (!skill) {
          const available = skills.map((s) => s.id).join(", ");
          return asError(`No skill with id "${id}". Available: ${available}`);
        }
        return asText(skill);
      } catch (error) {
        return asError(`Failed to fetch skill: ${error.message}`);
      }
    },
  );

  return server;
};
