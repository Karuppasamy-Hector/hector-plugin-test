# Hector MCP Plugin — Connection Test

A deliberately minimal [MCP](https://modelcontextprotocol.io) server used to
verify that a Hector plugin can connect from **Claude** and **ChatGPT**.

This is a connectivity harness, not the real plugin. It establishes the
structure the full plugin will use.

## Why it is shaped this way

| Decision | Reason |
|---|---|
| **Streamable HTTP** transport | Neither Claude nor ChatGPT can launch a local process. Both need a remote HTTPS endpoint, so stdio is not an option. |
| **Stateless** (no session ids) | Session handling is the most common cause of "connects, then immediately drops" with third-party clients. Not needed for a test. |
| Tools named **`search`** and **`fetch`** | ChatGPT's connector flow expects these names for its deep-research path. Claude is happy with any tool names, so this satisfies both. |
| Skills exposed **through tools**, not MCP prompts | ChatGPT consumes **tools only** — MCP prompts and resources are invisible there. Skills must be reachable via a tool call to work in both clients. |

That last row is the important one for the team: it is the architectural
constraint the full plugin inherits.

## Tools

| Tool | Purpose |
|---|---|
| `ping` | Connectivity check. Echoes a message with a server timestamp. |
| `search` | Search skills by keyword. Empty query lists all of them. |
| `fetch` | Return the full markdown body of one skill by id. |

## Run locally

```bash
npm install
npm start
```

Then verify:

```bash
curl -s localhost:3000/health
```

## Expose it publicly

Both clients need a public HTTPS URL — `localhost` will not work.

```bash
ngrok http 3000
```

Your MCP endpoint is the forwarding URL with `/mcp` appended, for example
`https://<subdomain>.ngrok-free.app/mcp`.

## Connect from Claude

1. Go to **Settings → Connectors → Add custom connector**.
2. Paste the public `/mcp` URL.
3. Leave authentication empty — this test server is intentionally open.
4. Ask Claude: *"use the ping tool"*, then *"search for hector skills"*.

## Connect from ChatGPT

1. Enable **Settings → Connectors** (developer mode may be required).
2. Add a connector pointing at the same public `/mcp` URL.
3. No authentication.
4. Ask it to search, then fetch `hello-hector`.

## Adding a skill

Drop a markdown file into `skills/`:

```markdown
---
id: my-skill
title: My Skill
description: One line describing when to use this.
---

# My Skill

Body text returned by `fetch`.
```

Skills are read from disk per request, so a new file is picked up without a
restart. `id` falls back to the filename if omitted.

## Tests

```bash
npm test
```

Six smoke tests drive the real MCP protocol over an in-memory transport,
covering tool registration, `ping`, `search` (listing and filtering), and
`fetch` (success and unknown-id error).

## Layout

```
src/server.js   HTTP entrypoint, /mcp and /health routes
src/mcp.js      MCP server and tool definitions
src/skills.js   Loads and searches markdown skills
skills/         Skill markdown files
test/           Smoke tests
```

## Security note

This server has **no authentication** and is safe only as a throwaway
connectivity test. Do not put real data in `skills/` while it is publicly
tunnelled. The production plugin needs auth before it carries anything real.
