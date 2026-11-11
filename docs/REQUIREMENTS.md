# ScopeLock implementation requirements

Derived from the agreed PLAN.md. These IDs track ScopeLock itself. Each acceptance statement is the named observable behavior; detailed semantics are in SPEC.md. No entry is claimed verified merely by being listed.

# Phase P01: Specification and representative fixtures

## REQ-001: Define schemas, IDs, status transitions, evidence eligibility, and freshness rules.
- Acceptance: Define schemas, IDs, status transitions, evidence eligibility, and freshness rules.

## REQ-002: Specify Markdown input: one explicit requirement heading per item; preserve source line references. Do not imply automatic AI extraction.
- Acceptance: Specify Markdown input: one explicit requirement heading per item; preserve source line references. Do not imply automatic AI extraction.

## REQ-003: Define CLI commands, MCP contracts, dashboard routes, and scope approval behavior.
- Acceptance: Define CLI commands, MCP contracts, dashboard routes, and scope approval behavior.

## REQ-004: Sketch overview, phase detail, requirement detail, checks, logs, and scope-review views.
- Acceptance: Sketch overview, phase detail, requirement detail, checks, logs, and scope-review views.

## REQ-005: Prepare a tiny example application with five requirements across at least two phases, including an intentional failure and a manual criterion.
- Acceptance: Prepare a tiny example application with five requirements across at least two phases, including an intentional failure and a manual criterion.

## REQ-006: Assign implementation requirement IDs and map each to a phase and acceptance criteria.
- Acceptance: Assign implementation requirement IDs and map each to a phase and acceptance criteria.

# Phase P02: Reliable shared engine and persistence

## REQ-007: Implement validated records, stable IDs, referential integrity, and schema versioning.
- Acceptance: Implement validated records, stable IDs, referential integrity, and schema versioning.

## REQ-008: Implement source preservation, reviewed scope baselines, and explicit change decisions.
- Acceptance: Implement source preservation, reviewed scope baselines, and explicit change decisions.

## REQ-009: Implement atomic persistence, revision conflicts, cross-process locking, and crash recovery.
- Acceptance: Implement atomic persistence, revision conflicts, cross-process locking, and crash recovery.

## REQ-010: Ensure state and event records recover consistently after interrupted mutations.
- Acceptance: Ensure state and event records recover consistently after interrupted mutations.

## REQ-011: Preserve history and provide portable backup/export and validated restore.
- Acceptance: Preserve history and provide portable backup/export and validated restore.

## REQ-012: Reject dependency cycles, invalid references, and malformed imported state.
- Acceptance: Reject dependency cycles, invalid references, and malformed imported state.

## REQ-013: Provide actionable errors without silently discarding data.
- Acceptance: Provide actionable errors without silently discarding data.

# Phase P03: CLI and local project workflow

## REQ-014: Implement initialization, Markdown import, review, and scope confirmation.
- Acceptance: Implement initialization, Markdown import, review, and scope confirmation.

## REQ-015: Implement requirement inspection, implementation updates, blockers, and evidence registration.
- Acceptance: Implement requirement inspection, implementation updates, blockers, and evidence registration.

## REQ-016: Implement scope-change proposal, diff, acceptance, and rejection.
- Acceptance: Implement scope-change proposal, diff, acceptance, and rejection.

## REQ-017: Implement status, JSON output, and Markdown report export.
- Acceptance: Implement status, JSON output, and Markdown report export.

## REQ-018: Implement `doctor` for invalid state, missing files, unavailable executables, and configuration problems.
- Acceptance: Implement `doctor` for invalid state, missing files, unavailable executables, and configuration problems.

## REQ-019: Set clear exit codes and validate paths within the selected project.
- Acceptance: Set clear exit codes and validate paths within the selected project.

# Phase P04: Phase planning, gates, and handoff

## REQ-020: Create, order, inspect, and activate phases; map requirements to their owning phase.
- Acceptance: Create, order, inspect, and activate phases; map requirements to their owning phase.

## REQ-021: Validate phase and requirement dependencies and expose blockers.
- Acceptance: Validate phase and requirement dependencies and expose blockers.

## REQ-022: Present active-phase context with project-wide constraints and relevant dependencies.
- Acceptance: Present active-phase context with project-wide constraints and relevant dependencies.

## REQ-023: Evaluate required phase exit criteria using registered evidence; connect to executable checks in P06.
- Acceptance: Evaluate required phase exit criteria using registered evidence; connect to executable checks in P06.

## REQ-024: Record continuation overrides with user reason and unmet criteria intact.
- Acceptance: Record continuation overrides with user reason and unmet criteria intact.

## REQ-025: Generate a concise pause/resume handoff from recorded state.
- Acceptance: Generate a concise pause/resume handoff from recorded state.

## REQ-026: Support project-wide checks and later-phase regression impact.
- Acceptance: Support project-wide checks and later-phase regression impact.

# Phase P05: Local graphical dashboard

## REQ-027: Overview: separate implementation and verification counts, active phase, failures, and blockers.
- Acceptance: Overview: separate implementation and verification counts, active phase, failures, and blockers.

## REQ-028: Phase roadmap/detail: goals, dependencies, requirements, exit criteria, overrides, and verification.
- Acceptance: Phase roadmap/detail: goals, dependencies, requirements, exit criteria, overrides, and verification.

## REQ-029: Requirement detail: source, acceptance criteria, history, evidence, and affected files.
- Acceptance: Requirement detail: source, acceptance criteria, history, evidence, and affected files.

## REQ-030: Check and evidence views: execution state, results, duration, code state, and artifacts.
- Acceptance: Check and evidence views: execution state, results, duration, code state, and artifacts.

## REQ-031: Activity timeline and searchable/filterable recorded logs.
- Acceptance: Activity timeline and searchable/filterable recorded logs.

## REQ-032: Scope-change review with explicit accept/reject controls.
- Acceptance: Scope-change review with explicit accept/reject controls.

## REQ-033: Integration view: configured status, last connection check, and last recorded activity; do not imply a continuously connected agent.
- Acceptance: Integration view: configured status, last connection check, and last recorded activity; do not imply a continuously connected agent.

## REQ-034: Live updates with reconnect recovery and consistent snapshot loading.
- Acceptance: Live updates with reconnect recovery and consistent snapshot loading.

## REQ-035: Filters by phase, requirement, result, reporting agent, and date where applicable.
- Acceptance: Filters by phase, requirement, result, reporting agent, and date where applicable.

## REQ-036: Keyboard access, labelled controls, status text alongside colors, and readable empty/error states.
- Acceptance: Keyboard access, labelled controls, status text alongside colors, and readable empty/error states.

## REQ-037: Bind locally, validate request origins and host headers, protect mutations against cross-site requests, and render logs/Markdown as untrusted content.
- Acceptance: Bind locally, validate request origins and host headers, protect mutations against cross-site requests, and render logs/Markdown as untrusted content.

# Phase P06: Checks, evidence, logs, and regression detection

## REQ-038: Run explicitly user-configured commands with argument arrays, working directories, timeouts, and cancellation.
- Acceptance: Run explicitly user-configured commands with argument arrays, working directories, timeouts, and cancellation.

## REQ-039: Do not execute commands imported from a requirements document automatically. Mark check-definition changes for user review before execution.
- Acceptance: Do not execute commands imported from a requirements document automatically. Mark check-definition changes for user review before execution.

## REQ-040: Capture exit code, duration, output, code-state fingerprint, scope revision, and linked criteria.
- Acceptance: Capture exit code, duration, output, code-state fingerprint, scope revision, and linked criteria.

## REQ-041: Stream bounded output to the dashboard and retain configurable log history.
- Acceptance: Stream bounded output to the dashboard and retain configurable log history.

## REQ-042: Redact common secret patterns before storing or streaming output; never collect full environment files. Clearly state that redaction is incomplete.
- Acceptance: Redact common secret patterns before storing or streaming output; never collect full environment files. Clearly state that redaction is incomplete.

## REQ-043: Attach local screenshots, test reports, file references, and explicit human verification notes.
- Acceptance: Attach local screenshots, test reports, file references, and explicit human verification notes.

## REQ-044: Label evidence origin and distinguish a successful process exit from proof of broader feature correctness.
- Acceptance: Label evidence origin and distinguish a successful process exit from proof of broader feature correctness.

## REQ-045: Detect stale evidence and regressions; recalculate affected phase verification.
- Acceptance: Detect stale evidence and regressions; recalculate affected phase verification.

## REQ-046: Provide log clearing/retention controls; retain an event noting removal without retaining removed content.
- Acceptance: Provide log clearing/retention controls; retain an event noting removal without retaining removed content.

## REQ-047: Make health checks report missing or removed evidence accurately.
- Acceptance: Make health checks report missing or removed evidence accurately.

# Phase P07: Local MCP interface

## REQ-048: Expose tools for reading scope, phases, requirements, blockers, and next eligible tasks.
- Acceptance: Expose tools for reading scope, phases, requirements, blockers, and next eligible tasks.

## REQ-049: Expose implementation updates, evidence submission, scope-change proposals, and handoff retrieval.
- Acceptance: Expose implementation updates, evidence submission, scope-change proposals, and handoff retrieval.

## REQ-050: Expose check execution only for previously reviewed definitions.
- Acceptance: Expose check execution only for previously reviewed definitions.

## REQ-051: Reuse engine validation and revision rules; restrict operations to the selected project.
- Acceptance: Reuse engine validation and revision rules; restrict operations to the selected project.

## REQ-052: Return compact structured responses and useful errors.
- Acceptance: Return compact structured responses and useful errors.

## REQ-053: Exclude acceptance of scope changes and user-only overrides from agent-facing tools.
- Acceptance: Exclude acceptance of scope changes and user-only overrides from agent-facing tools.

## REQ-054: Bound tool output and provide references for large logs instead of inserting full output into agent context.
- Acceptance: Bound tool output and provide references for large logs instead of inserting full output into agent context.

# Phase P08: Claude Code adapter

## REQ-055: Verify current official instructions and MCP configuration behavior.
- Acceptance: Verify current official instructions and MCP configuration behavior.

## REQ-056: Install marked project guidance and local MCP configuration safely.
- Acceptance: Install marked project guidance and local MCP configuration safely.

## REQ-057: Explain the active-phase → requirement → implementation → evidence workflow.
- Acceptance: Explain the active-phase → requirement → implementation → evidence workflow.

## REQ-058: Preserve existing instructions/settings and support idempotent installation and safe uninstall.
- Acceptance: Preserve existing instructions/settings and support idempotent installation and safe uninstall.

## REQ-059: Add connection diagnostics and document permissions/restart requirements.
- Acceptance: Add connection diagnostics and document permissions/restart requirements.

## REQ-060: Run a real session against the fixture and record target version and surface.
- Acceptance: Run a real session against the fixture and record target version and surface.

# Phase P09: Codex adapter

## REQ-061: Verify current official project-instruction and MCP configuration behavior.
- Acceptance: Verify current official project-instruction and MCP configuration behavior.

## REQ-062: Install marked `AGENTS.md` guidance and supported local MCP configuration without replacing existing content.
- Acceptance: Install marked `AGENTS.md` guidance and supported local MCP configuration without replacing existing content.

## REQ-063: Add connection diagnostics, permissions guidance, and safe uninstall.
- Acceptance: Add connection diagnostics, permissions guidance, and safe uninstall.

## REQ-064: Run the same fixture workflow used for Claude Code.
- Acceptance: Run the same fixture workflow used for Claude Code.

## REQ-065: Record tested Codex version and execution surface; document any surface-specific limitations.
- Acceptance: Record tested Codex version and execution surface; document any surface-specific limitations.

# Phase P10: Antigravity adapter

## REQ-066: Verify current official rules/skills and MCP configuration behavior; do not assume paths from other tools.
- Acceptance: Verify current official rules/skills and MCP configuration behavior; do not assume paths from other tools.

## REQ-067: Install appropriate marked instructions and supported local MCP configuration.
- Acceptance: Install appropriate marked instructions and supported local MCP configuration.

## REQ-068: Add connection diagnostics, permissions guidance, and safe uninstall.
- Acceptance: Add connection diagnostics, permissions guidance, and safe uninstall.

## REQ-069: Run the same fixture workflow and record tested version and execution surface.
- Acceptance: Run the same fixture workflow and record tested version and execution surface.

# Phase P11: Cross-agent and cross-platform validation

## REQ-070: Start work in one agent and continue in the other two without reimporting or duplicating requirements.
- Acceptance: Start work in one agent and continue in the other two without reimporting or duplicating requirements.

## REQ-071: Confirm all interfaces display identical scope revisions, phase state, and results.
- Acceptance: Confirm all interfaces display identical scope revisions, phase state, and results.

## REQ-072: Verify a failed earlier-phase check remains visible after advancing to a later phase.
- Acceptance: Verify a failed earlier-phase check remains visible after advancing to a later phase.

## REQ-073: Verify a scope proposal does not alter the confirmed baseline without explicit user action.
- Acceptance: Verify a scope proposal does not alter the confirmed baseline without explicit user action.

## REQ-074: Exercise concurrent updates, interrupted writes, missing evidence, stale evidence, and dashboard reconnect.
- Acceptance: Exercise concurrent updates, interrupted writes, missing evidence, stale evidence, and dashboard reconnect.

## REQ-075: Test CLI, local server, and installation behavior on Windows, macOS, and Linux through available CI and real environments.
- Acceptance: Test CLI, local server, and installation behavior on Windows, macOS, and Linux through available CI and real environments.

## REQ-076: Test representative secret redaction, untrusted log rendering, path handling, and local request protections.
- Acceptance: Test representative secret redaction, untrusted log rendering, path handling, and local request protections.

## REQ-077: Publish an integration matrix separating automated contract checks from real-agent sessions.
- Acceptance: Publish an integration matrix separating automated contract checks from real-agent sessions.

# Phase P12: Documentation, packaging, and open-source release

## REQ-078: Add license, README, contribution guide, security-reporting guidance, and issue templates.
- Acceptance: Add license, README, contribution guide, security-reporting guidance, and issue templates.

## REQ-079: Document install, five-minute example, dashboard, phase planning, checks, evidence, backups, and uninstall.
- Acceptance: Document install, five-minute example, dashboard, phase planning, checks, evidence, backups, and uninstall.

## REQ-080: Document all three adapters, tested versions, configuration limits, and agent permission considerations.
- Acceptance: Document all three adapters, tested versions, configuration limits, and agent permission considerations.

## REQ-081: Explain the visibility boundary: ScopeLock records its own executions and submitted events, not every private conversation or agent action.
- Acceptance: Explain the visibility boundary: ScopeLock records its own executions and submitted events, not every private conversation or agent action.

## REQ-082: Add public-package build, release checks, changelog, and documentation site.
- Acceptance: Add public-package build, release checks, changelog, and documentation site.

## REQ-083: Use ScopeLock to track its own requirements and attach final phase reports.
- Acceptance: Use ScopeLock to track its own requirements and attach final phase reports.

## REQ-084: Test a clean package installation against the example without a paid service dependency.
- Acceptance: Test a clean package installation against the example without a paid service dependency.

## REQ-085: Publish source and package only after the release gates pass and the destination accounts are available.
- Acceptance: Publish source and package only after the release gates pass and the destination accounts are available.

# Phase P13: Requirement coverage map (Feature A)
- Phase depends: P02, P05, P06

## REQ-086: Extend requirement model to track linked source files and parse explicit file declarations from requirements markdown.
- Acceptance: Requirement model tracks linked source files and parses - Files: lines from markdown.

## REQ-087: Implement coverage analyzer linking requirements to phases, files, checks, and recorded evidence.
- Acceptance: Coverage analyzer calculates missing links and implemented-unverified items across all requirements.

## REQ-088: Expose interactive coverage inspection with drill-down navigation opening underlying records.
- Acceptance: Coverage summary counts link directly to underlying requirement records.

## REQ-089: Provide explicit verification boundary notices across interfaces stating that links do not prove correctness.
- Acceptance: Coverage map interfaces display explicit notice that linked files and check execution do not automatically prove correctness.

# Phase P14: Dependency graph & cycle detection (Feature B)
- Phase depends: P04, P13

## REQ-090: Build dependency graph analysis for phases and requirements with topological ordering.
- Acceptance: Topological dependency tree is generated for phases and requirements.

## REQ-091: Calculate blockers and eligible-to-start work items based on unsatisfied dependencies.
- Acceptance: Blockers list explicit reasons and eligible-to-start items are accurately identified.

## REQ-092: Detect cycles and invalid references with actionable error messages.
- Acceptance: Circular dependencies and invalid references are rejected without corrupting state.

## REQ-093: Provide accessible list/tree representation alongside visual graph.
- Acceptance: Full accessible text alternative is provided for dependency relationships.

# Phase P15: Change-impact tracking (Feature C)
- Phase depends: P06, P13

## REQ-094: Implement per-file content hashing and change detector across the workspace.
- Acceptance: Per-file SHA-256 fingerprinting detects modified, added, and deleted workspace files.

## REQ-095: Evaluate change impact against linked requirement files and artifacts, flagging affected evidence as stale.
- Acceptance: Modifying a linked file flags the associated criteria and requirement evidence as stale.

## REQ-096: Provide human-readable explanations detailing which files changed and why a recheck is advised.
- Acceptance: Impact report details exact modified paths and explains the necessity of re-running checks.

## REQ-097: Handle dirty working trees, untracked modifications, and non-Git repositories explicitly.
- Acceptance: Change detection operates consistently in dirty working trees and non-Git environments.

## REQ-098: Preserve previous verification history and runs rather than overwriting historical evidence.
- Acceptance: Prior check runs and evidence records remain visible in history after staleness detection.

# Phase P16: Agent handoff panel & shared state (Feature D)
- Phase depends: P04, P07, P13

## REQ-099: Construct enriched handoff snapshot aggregating phase, current task, implementation stats, runs, blockers, and next action.
- Acceptance: Handoff returns complete project state snapshot with next actionable task.

## REQ-100: Record timestamps and reporting agent identity, clearly separating agent claims from human verifications.
- Acceptance: Handoff displays timestamps, agent identity, and differentiates agent notes from verified passes.

## REQ-101: Implement Markdown handoff exporter formatted for direct consumption by subsequent coding agents.
- Acceptance: Exported Markdown handoff contains structured sections ready for coding agent context ingestion.

## REQ-102: Guarantee shared state consistency across CLI, MCP, and Dashboard.
- Acceptance: CLI handoff, MCP get_handoff, and Dashboard handoff render identical state.

# Phase P17: Build timeline & activity filtering (Feature E)
- Phase depends: P05, P06, P16

## REQ-103: Enrich event data model to associate events with specific phase, requirement, check, run, and evidence IDs.
- Acceptance: Event records link to associated entity IDs.

## REQ-104: Implement multi-dimensional filtering across phase, requirement, actor, event type, result, and date range.
- Acceptance: Timeline query filters accurately across all defined dimensions.

## REQ-105: Record structured events for scope decisions, updates, check runs, evidence registrations, and phase transitions.
- Acceptance: System operations emit structured events into the atomic timeline.

## REQ-106: Design readable empty states when no activity matches the active filter criteria.
- Acceptance: Filter queries with zero matches return clear, actionable empty state messages.

# Phase P18: Progress comparison & persistent checkpoints (Feature F)
- Phase depends: P02, P15

## REQ-107: Implement persistent checkpoint creation and storage capturing atomic project snapshots.
- Acceptance: Checkpoints persist across project reloads and capture full project state.

## REQ-108: Implement stable-ID differential comparison identifying scope changes, status updates, verification shifts, blockers, and regressions.
- Acceptance: Comparing two checkpoints identifies added/removed requirements, status changes, and regressions.

## REQ-109: Decouple scope growth from implementation progress in differential metrics.
- Acceptance: Differential metrics report scope growth delta separately from implementation progress delta.

# Phase P19: Scope-drift review (Feature G)
- Phase depends: P13, P15

## REQ-110: Scan working tree for unlinked changed files not mapped to any requirement or approved supporting infrastructure.
- Acceptance: Scope drift review lists all unlinked workspace files.

## REQ-111: Provide mechanisms to link discovered files to requirements or record them as documented supporting infrastructure.
- Acceptance: Users can link unlinked files to requirements or add them to documented supporting infrastructure.

## REQ-112: Accurately detect additions, deletions, and modifications in both Git and non-Git environments.
- Acceptance: Workspace file scans handle additions, deletions, and modifications across Git and non-Git setups.

## REQ-113: Maintain review heuristic boundary: never automatically reject code changes or approve scope alterations.
- Acceptance: Drift review functions strictly as a human review heuristic without automatic mutation.

# Phase P20: Release-readiness report (Feature H)
- Phase depends: P06, P14, P15, P18

## REQ-114: Build release-readiness assessment engine auditing exit gates, failed checks, stale evidence, and blockers.
- Acceptance: Readiness engine audits all phase exit criteria, failed runs, stale criteria, and active blockers.

## REQ-115: Enforce clear separation between implementation completeness and verified release gates.
- Acceptance: Implemented counts and verified exit gates are reported as separate dimensions.

## REQ-116: Index all readiness blockers with direct links and references to offending records.
- Acceptance: Each readiness finding links directly to the source requirement, run, or phase.

## REQ-117: Export comprehensive Markdown release-readiness report for stakeholder review.
- Acceptance: Markdown release-readiness report matches programmatic audit results.

## REQ-118: Strictly enforce honest gate certification: never mark gates complete without actual recorded evidence.
- Acceptance: Release readiness cannot claim ready while required criteria or gates remain unverified.

# Phase P21: Dashboard overview & saved filters (Feature I & Overview)
- Phase depends: P05, P13, P14, P15, P16, P17, P18, P19, P20

## REQ-119: Implement four separate overview summaries with documented count calculations and no single completion percentage.
- Acceptance: Dashboard overview renders Implementation, Verification, Blockers, and Release Readiness summaries.

## REQ-120: Enable interactive count drill-downs opening matching records for every overview metric.
- Acceptance: Clicking overview summary counts filters and navigates to underlying matching records.

## REQ-121: Provide built-in filters for blocked work, failed checks, stale evidence, and implemented-but-unverified requirements.
- Acceptance: Built-in quick filter pills correctly filter records.

## REQ-122: Enable creating, renaming, deleting, and persisting custom filters locally across sessions.
- Acceptance: Custom filters persist across sessions and support renaming and deletion.

## REQ-123: Strictly prohibit fabricated build logs; label retrospective notes and empty states clearly.
- Acceptance: Timeline and logs reflect actual events with clear labeling.

# Phase P22: Parallel-work tracking (Feature J — Deferred Milestone)
- Phase depends: P16, P21

## REQ-124: Define data model for agent work assignments and active task leases.
- Acceptance: Specification defines agent work assignments and lease data model.

## REQ-125: Specify conflict detection algorithm for overlapping requirement assignments.
- Acceptance: Algorithm identifies overlapping requirement assignments across agents.

## REQ-126: Document visibility boundary: ScopeLock observes submitted operations, not uncommitted agent local state.
- Acceptance: Visibility boundary is explicitly documented as submitted operations only.
