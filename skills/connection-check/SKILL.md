---
name: connection-check
description: Checklist for verifying a Hector plugin installed correctly from its GitHub URL. Use when the user wants to confirm plugin installation, troubleshoot a plugin that is not appearing, or check which skills loaded.
---

# Connection Check

Walk through this to confirm the plugin installed correctly.

## Checklist

1. **Plugin appears in the client** — it is listed after adding the
   GitHub URL.
2. **Both skills loaded** — `hello-hector` and `connection-check`.
3. **A skill triggers** — asking to "test the Hector plugin" invokes
   `hello-hector`.
4. **Body text comes back** — the model can quote content from the
   skill file.

## If a skill does not appear

- Confirm the repo is **public**, or that the client has access to it.
- Confirm the path in `.claude-plugin/marketplace.json` matches the real
  folder under `skills/`.
- Confirm each skill folder contains a file named exactly `SKILL.md`.
- Confirm the frontmatter has both `name` and `description`.
- Re-install the plugin so the client re-reads the repo.
