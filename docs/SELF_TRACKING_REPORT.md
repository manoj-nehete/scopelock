# ScopeLock development — ScopeLock report

Scope revision 1 · 2026-11-06T12:03:33.014Z

| Phase | Implementation | Verification |
| --- | --- | --- |
| P01: Specification and representative fixtures | implemented | not_checked |
| P02: Reliable shared engine and persistence | implemented | not_checked |
| P03: CLI and local project workflow | implemented | not_checked |
| P04: Phase planning, gates, and handoff | implemented | not_checked |
| P05: Local graphical dashboard | implemented | not_checked |
| P06: Checks, evidence, logs, and regression detection | implemented | not_checked |
| P07: Local MCP interface | implemented | not_checked |
| P08: Claude Code adapter | implemented | passed |
| P09: Codex adapter | implemented | passed |
| P10: Antigravity adapter | implemented | passed |
| P11: Cross-agent and cross-platform validation | implemented | passed |
| P12: Documentation, packaging, and open-source release | implemented | passed |

| Requirement | Implementation | Verification |
| --- | --- | --- |
| REQ-001: Define schemas, IDs, status transitions, evidence eligibility, and freshness rules. | implemented | not_checked |
| REQ-002: Specify Markdown input: one explicit requirement heading per item; preserve source line references. Do not imply automatic AI extraction. | implemented | not_checked |
| REQ-003: Define CLI commands, MCP contracts, dashboard routes, and scope approval behavior. | implemented | not_checked |
| REQ-004: Sketch overview, phase detail, requirement detail, checks, logs, and scope-review views. | implemented | not_checked |
| REQ-005: Prepare a tiny example application with five requirements across at least two phases, including an intentional failure and a manual criterion. | implemented | not_checked |
| REQ-006: Assign implementation requirement IDs and map each to a phase and acceptance criteria. | implemented | not_checked |
| REQ-007: Implement validated records, stable IDs, referential integrity, and schema versioning. | implemented | not_checked |
| REQ-008: Implement source preservation, reviewed scope baselines, and explicit change decisions. | implemented | not_checked |
| REQ-009: Implement atomic persistence, revision conflicts, cross-process locking, and crash recovery. | implemented | not_checked |
| REQ-010: Ensure state and event records recover consistently after interrupted mutations. | implemented | not_checked |
| REQ-011: Preserve history and provide portable backup/export and validated restore. | implemented | not_checked |
| REQ-012: Reject dependency cycles, invalid references, and malformed imported state. | implemented | not_checked |
| REQ-013: Provide actionable errors without silently discarding data. | implemented | not_checked |
| REQ-014: Implement initialization, Markdown import, review, and scope confirmation. | implemented | not_checked |
| REQ-015: Implement requirement inspection, implementation updates, blockers, and evidence registration. | implemented | not_checked |
| REQ-016: Implement scope-change proposal, diff, acceptance, and rejection. | implemented | not_checked |
| REQ-017: Implement status, JSON output, and Markdown report export. | implemented | not_checked |
| REQ-018: Implement `doctor` for invalid state, missing files, unavailable executables, and configuration problems. | implemented | not_checked |
| REQ-019: Set clear exit codes and validate paths within the selected project. | implemented | not_checked |
| REQ-020: Create, order, inspect, and activate phases; map requirements to their owning phase. | implemented | not_checked |
| REQ-021: Validate phase and requirement dependencies and expose blockers. | implemented | not_checked |
| REQ-022: Present active-phase context with project-wide constraints and relevant dependencies. | implemented | not_checked |
| REQ-023: Evaluate required phase exit criteria using registered evidence; connect to executable checks in P06. | implemented | not_checked |
| REQ-024: Record continuation overrides with user reason and unmet criteria intact. | implemented | not_checked |
| REQ-025: Generate a concise pause/resume handoff from recorded state. | implemented | not_checked |
| REQ-026: Support project-wide checks and later-phase regression impact. | implemented | not_checked |
| REQ-027: Overview: separate implementation and verification counts, active phase, failures, and blockers. | implemented | not_checked |
| REQ-028: Phase roadmap/detail: goals, dependencies, requirements, exit criteria, overrides, and verification. | implemented | not_checked |
| REQ-029: Requirement detail: source, acceptance criteria, history, evidence, and affected files. | implemented | not_checked |
| REQ-030: Check and evidence views: execution state, results, duration, code state, and artifacts. | implemented | not_checked |
| REQ-031: Activity timeline and searchable/filterable recorded logs. | implemented | not_checked |
| REQ-032: Scope-change review with explicit accept/reject controls. | implemented | not_checked |
| REQ-033: Integration view: configured status, last connection check, and last recorded activity; do not imply a continuously connected agent. | implemented | not_checked |
| REQ-034: Live updates with reconnect recovery and consistent snapshot loading. | implemented | not_checked |
| REQ-035: Filters by phase, requirement, result, reporting agent, and date where applicable. | implemented | not_checked |
| REQ-036: Keyboard access, labelled controls, status text alongside colors, and readable empty/error states. | implemented | not_checked |
| REQ-037: Bind locally, validate request origins and host headers, protect mutations against cross-site requests, and render logs/Markdown as untrusted content. | implemented | not_checked |
| REQ-038: Run explicitly user-configured commands with argument arrays, working directories, timeouts, and cancellation. | implemented | not_checked |
| REQ-039: Do not execute commands imported from a requirements document automatically. Mark check-definition changes for user review before execution. | implemented | not_checked |
| REQ-040: Capture exit code, duration, output, code-state fingerprint, scope revision, and linked criteria. | implemented | not_checked |
| REQ-041: Stream bounded output to the dashboard and retain configurable log history. | implemented | not_checked |
| REQ-042: Redact common secret patterns before storing or streaming output; never collect full environment files. Clearly state that redaction is incomplete. | implemented | not_checked |
| REQ-043: Attach local screenshots, test reports, file references, and explicit human verification notes. | implemented | not_checked |
| REQ-044: Label evidence origin and distinguish a successful process exit from proof of broader feature correctness. | implemented | not_checked |
| REQ-045: Detect stale evidence and regressions; recalculate affected phase verification. | implemented | not_checked |
| REQ-046: Provide log clearing/retention controls; retain an event noting removal without retaining removed content. | implemented | not_checked |
| REQ-047: Make health checks report missing or removed evidence accurately. | implemented | not_checked |
| REQ-048: Expose tools for reading scope, phases, requirements, blockers, and next eligible tasks. | implemented | not_checked |
| REQ-049: Expose implementation updates, evidence submission, scope-change proposals, and handoff retrieval. | implemented | not_checked |
| REQ-050: Expose check execution only for previously reviewed definitions. | implemented | not_checked |
| REQ-051: Reuse engine validation and revision rules; restrict operations to the selected project. | implemented | not_checked |
| REQ-052: Return compact structured responses and useful errors. | implemented | not_checked |
| REQ-053: Exclude acceptance of scope changes and user-only overrides from agent-facing tools. | implemented | not_checked |
| REQ-054: Bound tool output and provide references for large logs instead of inserting full output into agent context. | implemented | not_checked |
| REQ-055: Verify current official instructions and MCP configuration behavior. | implemented | not_checked |
| REQ-056: Install marked project guidance and local MCP configuration safely. | implemented | not_checked |
| REQ-057: Explain the active-phase → requirement → implementation → evidence workflow. | implemented | not_checked |
| REQ-058: Preserve existing instructions/settings and support idempotent installation and safe uninstall. | implemented | not_checked |
| REQ-059: Add connection diagnostics and document permissions/restart requirements. | implemented | not_checked |
| REQ-060: Run a real session against the fixture and record target version and surface. | implemented | passed |
| REQ-061: Verify current official project-instruction and MCP configuration behavior. | implemented | not_checked |
| REQ-062: Install marked `AGENTS.md` guidance and supported local MCP configuration without replacing existing content. | implemented | not_checked |
| REQ-063: Add connection diagnostics, permissions guidance, and safe uninstall. | implemented | not_checked |
| REQ-064: Run the same fixture workflow used for Claude Code. | implemented | passed |
| REQ-065: Record tested Codex version and execution surface; document any surface-specific limitations. | implemented | not_checked |
| REQ-066: Verify current official rules/skills and MCP configuration behavior; do not assume paths from other tools. | implemented | not_checked |
| REQ-067: Install appropriate marked instructions and supported local MCP configuration. | implemented | not_checked |
| REQ-068: Add connection diagnostics, permissions guidance, and safe uninstall. | implemented | not_checked |
| REQ-069: Run the same fixture workflow and record tested version and execution surface. | implemented | passed |
| REQ-070: Start work in one agent and continue in the other two without reimporting or duplicating requirements. | implemented | passed |
| REQ-071: Confirm all interfaces display identical scope revisions, phase state, and results. | implemented | not_checked |
| REQ-072: Verify a failed earlier-phase check remains visible after advancing to a later phase. | implemented | not_checked |
| REQ-073: Verify a scope proposal does not alter the confirmed baseline without explicit user action. | implemented | not_checked |
| REQ-074: Exercise concurrent updates, interrupted writes, missing evidence, stale evidence, and dashboard reconnect. | implemented | not_checked |
| REQ-075: Test CLI, local server, and installation behavior on Windows, macOS, and Linux through available CI and real environments. | implemented | passed |
| REQ-076: Test representative secret redaction, untrusted log rendering, path handling, and local request protections. | implemented | not_checked |
| REQ-077: Publish an integration matrix separating automated contract checks from real-agent sessions. | implemented | not_checked |
| REQ-078: Add license, README, contribution guide, security-reporting guidance, and issue templates. | implemented | not_checked |
| REQ-079: Document install, five-minute example, dashboard, phase planning, checks, evidence, backups, and uninstall. | implemented | not_checked |
| REQ-080: Document all three adapters, tested versions, configuration limits, and agent permission considerations. | implemented | not_checked |
| REQ-081: Explain the visibility boundary: ScopeLock records its own executions and submitted events, not every private conversation or agent action. | implemented | not_checked |
| REQ-082: Add public-package build, release checks, changelog, and documentation site. | implemented | passed |
| REQ-083: Use ScopeLock to track its own requirements and attach final phase reports. | implemented | passed |
| REQ-084: Test a clean package installation against the example without a paid service dependency. | implemented | passed |
| REQ-085: Publish source and package only after the release gates pass and the destination accounts are available. | implemented | passed |
