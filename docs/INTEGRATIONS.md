# Agent integrations

Build ScopeLock before installing an adapter. From your project directory, use `scopelock connect claude-code`, `scopelock connect codex`, or `scopelock connect antigravity`. Each installation points to the current local Node executable and built ScopeLock CLI. Reinstall after moving ScopeLock or changing machines. Existing unrelated configuration is preserved; backups are stored privately under .scopelock/adapter-backups.

| Agent | Instructions | Project MCP configuration |
| --- | --- | --- |
| Claude Code | Managed section in CLAUDE.md | .mcp.json |
| Codex | Managed section in AGENTS.md | .codex/config.toml |
| Antigravity | .agents/rules/scopelock.md | .agents/mcp_config.json |

Restart the agent, open/trust the project and accept its MCP permission prompt where applicable. Ask it to call `get_handoff` and `get_requirements`. Then ask it to record implementation for one requirement and inspect the dashboard. Use `scopelock probe AGENT` for a local SDK handshake; this does not test the host agent itself. Use `scopelock disconnect AGENT` to remove managed additions. Modified managed blocks are not silently overwritten.

## Official references reviewed during implementation

- Codex: https://learn.chatgpt.com/docs/extend/mcp?surface=cli — project .codex/config.toml requires project trust.
- Claude Code: https://code.claude.com/docs/en/mcp — project .mcp.json and approval behavior.
- Antigravity: https://antigravity.google/docs/mcp — workspace .agents/mcp_config.json and stdio configuration.
- SDK: https://ts.sdk.modelcontextprotocol.io/server — local stdio server implementation.

## Compatibility status

These are implemented adapters with automated session and protocol validation. Tests exercise real stdio MCP communication, tool discovery, handoff reading, requirement updates, check execution, evidence submission, and safe uninstallation.

### Integration Matrix

| Agent | Target Config | Instructions File | Diagnostic Probe | MCP Session Workflow | Safe Config Round-Trip | Tested Platform |
| --- | --- | --- | --- | --- | --- | --- |
| **Claude Code** | `.mcp.json` | `CLAUDE.md` | Pass (10 tools) | Verified (`test/claude-adapter.test.mjs`) | Verified byte-for-byte | macOS / Linux |
| **Codex** | `.codex/config.toml` | `AGENTS.md` | Pass (10 tools) | Verified (`test/codex-adapter.test.mjs`) | Verified byte-for-byte | macOS / Linux |
| **Antigravity** | `.agents/mcp_config.json` | `.agents/rules/scopelock.md` | Pass (10 tools) | Verified (`test/antigravity-adapter.test.mjs`) | Verified byte-for-byte | macOS (Darwin arm64) |

### Cross-Agent Continuity

Verified via `test/cross-agent-handoff.test.mjs`:
- Claude Code initiates Phase P01 and implements REQ-001.
- Codex continues the same repository without reimporting requirements and implements REQ-002.
- Antigravity completes REQ-003, verifying Phase P01 exit gate and unlocking Phase P02.
- All three agents contribute evidence under distinct actor identities into the unified ScopeLock journal.
