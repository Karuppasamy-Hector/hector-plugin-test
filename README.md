# Hector Plugin — Test

A minimal test plugin that verifies Hector skills install and load correctly
from a GitHub URL.

There is **no source code and no server here** — a plugin is just markdown
files plus a manifest. The client reads this repo directly.

## What is in this repo

```
.claude-plugin/
  marketplace.json      Lists the plugin and where its skills live
  plugin.json           Plugin name, version, author
skills/
  hello-hector/
    SKILL.md            "The plugin works" smoke test
  connection-check/
    SKILL.md            Troubleshooting checklist
```

## How to install

Add this repo by URL:

```
https://github.com/Karuppasamy-Hector/hector-plugin-test
```

In Claude Code:

```bash
/plugin marketplace add Karuppasamy-Hector/hector-plugin-test
```

```bash
/plugin install hector-test@hector-plugin-test
```

## How to check it worked

1. Run `/plugin` and confirm **hector-test** is listed as installed.
2. Ask: *"test the Hector plugin"* — this should trigger the
   `hello-hector` skill.
3. The reply should say the plugin is installed and working, quoting
   text from `skills/hello-hector/SKILL.md`.

If a skill does not appear, the `connection-check` skill lists what to
verify.

## Adding a skill

1. Create `skills/<your-skill>/SKILL.md`:

```markdown
---
name: your-skill
description: What it does and when to use it. This sentence is how the model decides to trigger the skill, so be specific.
---

# Your Skill

Instructions for the model.
```

2. Add the path to the `skills` array in
   `.claude-plugin/marketplace.json`:

```json
"skills": [
  "./skills/hello-hector",
  "./skills/connection-check",
  "./skills/your-skill"
]
```

3. Commit and push. Re-install the plugin to pick up the change.

### Rules that matter

- The folder name and the `name:` in frontmatter **must match**.
- The file must be named exactly `SKILL.md`.
- `description` is required — it is what makes the skill trigger.
- Every skill folder must be listed in `marketplace.json`.

## Note on ChatGPT

This plugin format is Claude's. ChatGPT does not read plugin repos this
way — it connects to MCP servers over HTTPS and consumes **tools only**.

So for skills to work in ChatGPT, an MCP server has to expose them
through a tool call (for example `search` and `fetch` tools that return
skill text). That server is a separate piece of work from this repo —
this repo is the content those tools would serve.
