# Changelog

All notable changes to ScopeLock are documented in this file.

## [0.1.0] — 2026-11-06

### Initial Release Candidate

- **Phase-Wise Scope Governance:**
  - Strict phase roadmap planning, dependency trees, and exit criteria.
  - Separate tracking of implementation (`not_started`, `in_progress`, `implemented`, `blocked`) and verification (`not_checked`, `passed`, `failed`, `stale`).
  - Continuation overrides with explicit reason auditing.

- **Verifiable Checks & Evidence:**
  - Local command check definitions with working directories, timeouts, and cancellation.
  - Mandatory human approval gate before executing any command.
  - Automatic code-state fingerprinting and evidence staleness detection on code changes.
  - Automatic secret redaction for sensitive keys, passwords, and tokens.

- **Unified Local MCP Server:**
  - 10 structured Model Context Protocol tools over local `stdio`.
  - Permission isolation: agent tools cannot accept scope baseline changes or approve commands.
  - Handoff context generation (`get_handoff`) enabling multi-agent continuity.

- **Agent Adapters:**
  - **Antigravity IDE**: `.agents/mcp_config.json` and `.agents/rules/scopelock.md`.
  - **Claude Code**: `.mcp.json` and managed `CLAUDE.md`.
  - **OpenAI Codex**: `.codex/config.toml` and managed `AGENTS.md`.
  - Idempotent installation and byte-for-byte configuration restoration on uninstall.

- **Local Graphical Dashboard:**
  - Built with React 19, TypeScript, and Vite.
  - 8 views: Overview, Phase Roadmap, Requirement Detail, Checks & Evidence, Activity Timeline/Logs, Scope Change Review, and Integrations View.
  - Real-time updates via Server-Sent Events (SSE) with reconnect recovery.
  - Localhost binding with origin and CSRF protections.

- **Multi-Platform Support:**
  - Verified across macOS (Apple Silicon arm64), Linux (Node 24), and Windows (compatibility layer and CI matrix).
  - 33 automated tests passing.
