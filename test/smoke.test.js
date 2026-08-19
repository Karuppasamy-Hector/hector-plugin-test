import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/mcp.js";

/**
 * Connects a client to the server over an in-memory transport. This
 * exercises the real MCP protocol without binding a port.
 */
const connectClient = async () => {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  const client = new Client({ name: "smoke-test", version: "1.0.0" });

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return { client, close: () => Promise.all([client.close(), server.close()]) };
};

const textOf = (result) => result.content[0].text;

test("exposes ping, search and fetch tools", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const { tools } = await client.listTools();

  // Assert
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    ["fetch", "ping", "search"],
  );
  await close();
});

test("ping echoes the supplied message", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const result = await client.callTool({
    name: "ping",
    arguments: { message: "hello" },
  });

  // Assert
  const payload = JSON.parse(textOf(result));
  assert.equal(payload.ok, true);
  assert.equal(payload.echo, "hello");
  await close();
});

test("search with an empty query returns every skill", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const result = await client.callTool({
    name: "search",
    arguments: { query: "" },
  });

  // Assert
  const { results } = JSON.parse(textOf(result));
  const ids = results.map((skill) => skill.id);
  assert.ok(ids.includes("hello-hector"));
  assert.ok(ids.includes("connection-check"));
  await close();
});

test("search narrows results by keyword", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const result = await client.callTool({
    name: "search",
    arguments: { query: "connection" },
  });

  // Assert
  const { results } = JSON.parse(textOf(result));
  assert.deepEqual(results.map((skill) => skill.id), ["connection-check"]);
  await close();
});

test("fetch returns the full body of a skill", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const result = await client.callTool({
    name: "fetch",
    arguments: { id: "hello-hector" },
  });

  // Assert
  const skill = JSON.parse(textOf(result));
  assert.equal(skill.id, "hello-hector");
  assert.match(skill.body, /Hello Hector/);
  await close();
});

test("fetch reports an error for an unknown skill id", async () => {
  // Arrange
  const { client, close } = await connectClient();

  // Act
  const result = await client.callTool({
    name: "fetch",
    arguments: { id: "does-not-exist" },
  });

  // Assert
  assert.equal(result.isError, true);
  assert.match(textOf(result), /No skill with id/);
  await close();
});
