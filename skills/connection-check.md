---
id: connection-check
title: Connection Check
description: Checklist for verifying the Hector MCP plugin is reachable from a client.
---

# Connection Check

Use this to verify a deployment before handing the URL to the team.

## Checklist

- `GET /health` returns `{"ok": true}`.
- `POST /mcp` with an `initialize` request returns a `serverInfo` block.
- `tools/list` returns `ping`, `search`, and `fetch`.
- Calling `ping` echoes the message back with a timestamp.
- `search` with an empty query returns every available skill.
