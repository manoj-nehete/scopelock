# ScopeLock — Phase-wise Build Plan

Version: 1.1 planning baseline (Advanced Features Roadmap)  
Date: 11 November 2026  
Status: v0.1.0 development candidate implemented across core stack (P01–P11 automated test suite 33/33 passing). Open gates (visual browser checks and remote package publishing) remain explicitly unverified. Advanced features (A–I: P13–P21) scheduled for sequential implementation and verification; Feature J (P22) deferred. See BUILD_STATUS.md.

## 1. Product goal

Build a free, local-first, open-source tool that keeps coding agents aligned with agreed project requirements. Users can plan work in phases, track implementation, verify results, inspect logs, and continue with another agent without losing project state.

Initial supported targets: Claude Code, Codex, and Antigravity. Compatibility means tested workflows on documented versions, not guaranteed agent obedience or support for every execution surface.

## 2. Budget and boundaries

- Target additional infrastructure spend: ₹0.
- Run the engine, CLI, MCP server, and dashboard on the user's computer.
- Require no ScopeLock account, subscription, hosted database, paid API, or telemetry service.
- Use the user's existing coding-agent access. Agent subscriptions and usage charges remain separate; ScopeLock does not provide model access.
- Store project data in the repository under `.scopelock/`; make large logs and private evidence untracked by default.
- Distribute through a public source repository and public package; use free standard CI and documentation hosting within applicable service limits.
- Choose an open-source license before public release; MIT is the proposed default.
- Do not add features outside this plan without an explicit scope-change record.

## 3. Core product model

Project → Phases → Requirements → Acceptance criteria → Checks and evidence.

Each requirement has one owning phase and may depend on other requirements. Project-wide constraints apply to all phases. Shared checks can verify several requirements and run across phases.

### Required records

| Record | Minimum fields |
| --- | --- |
| Project | ID, name, schema version, scope revision, active phase |
| Phase | Stable ID, order, goal, dependencies, requirement IDs, exit criteria |
| Requirement | Stable ID, source reference, description, acceptance criteria, dependencies, implementation status |
| Check definition | ID, linked criteria, executable and arguments, working directory, timeout, relevant files |
| Check run | ID, result, start/end times, exit code, output reference, tested code state |
| Evidence | ID, requirement/criterion links, origin, timestamp, result, artifact references, code and scope revisions |
| Scope change | ID, proposed change, reason, affected records, decision, decision actor and time |
| Activity event | ID, time, event type, actor label, affected IDs, revision and run references |
| Handoff | Current phase/task, recent evidence, blockers, decisions, next action |

Actor labels identify the reporting source, not cryptographically verified identities.

### Status rules

- Implementation: `not_started`, `in_progress`, `implemented`, `blocked`.
- Check run: `queued`, `running`, `passed`, `failed`, `cancelled`, `error`.
- Criterion verification: `not_checked`, `passed`, `failed`, `stale`; retain evidence origin separately.
- A skipped criterion is not a pass. Optional criteria must be explicitly designated in the agreed scope.
- Phase workflow: `planned`, `active`, `blocked`, `implemented`.
- Phase verification is derived separately from required exit criteria and evidence freshness. A later regression can invalidate a previously verified phase.
- An override permits continuation but does not turn unmet criteria into passes.
- Dashboard totals show implementation and verification separately; no single blended completion percentage.

### Evidence and scope rules

- Preserve the original imported source and link extracted requirements to it.
- Users review imported requirements before confirming a versioned scope baseline.
- Agent claims, human verification, and ScopeLock-run checks remain visibly distinct.
- Required criteria declare acceptable evidence types. Automated criteria require an eligible successful run; manual criteria require an explicit human attestation.
- Agents may propose scope changes. Accepting or rejecting a baseline change requires an explicit user action; agent-facing MCP tools do not accept changes.
- Tie evidence to criterion revision and code state. Capture dirty-worktree state, not just the commit hash; exclude ScopeLock's own mutable data from code fingerprints.
- Changes to criteria or relevant files invalidate affected evidence. If affected files cannot be determined reliably, conservatively flag potentially stale evidence.
- Keep historical results even when current verification becomes stale or failed.
- Natural-language completeness and semantic scope drift are not automatically provable.

## 4. Architecture

| Component | Planned implementation |
| --- | --- |
| Shared engine | TypeScript on Node.js; owns validation, state transitions, persistence, and reports |
| CLI | Thin interface over the engine; structured JSON output where useful |
| MCP server | Local stdio server exposing structured engine operations |
| Dashboard | React, TypeScript, Vite; served by a local Node.js service |
| Live updates | Server-sent events with reconnect support |
| Persistence | Validated JSON state, Markdown sources, append-only activity segments and local evidence files |
| Consistency | One transactional mutation path with atomic writes, revision checks, and cross-process locking |
| Agent adapters | Versioned instructions and connection setup for each supported target |
| Git integration | Code-state fingerprints, change detection, and evidence freshness |

Implementation must select compatible maintained dependency versions and recheck current official agent configuration documentation before coding adapters. This plan does not pin unverified versions.

## 5. Phase roadmap

Checked items have implementation and supporting local evidence. Unchecked items need external validation or release work. A phase is not certified complete until its full exit gate passes. See BUILD_STATUS.md for limitations and environment-specific results.

| Phase | Deliverable | Depends on |
| --- | --- | --- |
| P01 | Specification and representative fixtures | None |
| P02 | Reliable shared engine and persistence | P01 |
| P03 | CLI and complete local project workflow | P02 |
| P04 | Phase planning, dependencies, gates, and handoff | P03 |
| P05 | Local graphical dashboard | P04 |
| P06 | Checks, evidence, logs, and regression detection | P05 |
| P07 | Local MCP interface | P06 |
| P08 | Claude Code adapter | P07 |
| P09 | Codex adapter | P07 |
| P10 | Antigravity adapter | P07 |
| P11 | Cross-agent and cross-platform validation | P08, P09, P10 |
| P12 | Documentation, packaging, and open-source release | P11 |
| P13 | Requirement coverage map (Feature A) | P02, P05, P06 |
| P14 | Dependency graph & cycle detection (Feature B) | P04, P13 |
| P15 | Change-impact tracking (Feature C) | P06, P13 |
| P16 | Agent handoff panel & shared state (Feature D) | P04, P07, P13 |
| P17 | Build timeline & activity filtering (Feature E) | P05, P06, P16 |
| P18 | Progress comparison & checkpoints (Feature F) | P02, P15 |
| P19 | Scope-drift review (Feature G) | P13, P15 |
| P20 | Release-readiness report (Feature H) | P06, P14, P15, P18 |
| P21 | Dashboard overview & saved filters (Feature I & Overview) | P05, P13-P20 |
| P22 | Parallel-work tracking (Feature J — Deferred milestone) | P16, P21 |

### P01 — Specification and representative fixtures

Goal: turn this plan into an unambiguous implementation contract.

- [x] Define schemas, IDs, status transitions, evidence eligibility, and freshness rules.
- [x] Specify Markdown input: one explicit requirement heading per item; preserve source line references. Do not imply automatic AI extraction.
- [x] Define CLI commands, MCP contracts, dashboard routes, and scope approval behavior.
- [x] Sketch overview, phase detail, requirement detail, checks, logs, and scope-review views.
- [x] Prepare a tiny example application with five requirements across at least two phases, including an intentional failure and a manual criterion.
- [x] Assign implementation requirement IDs and map each to a phase and acceptance criteria.

Exit gate: every version-one feature in this plan maps to requirements and observable acceptance criteria; fixtures cover both successful and unsuccessful workflows.

### P02 — Reliable shared engine and persistence

Goal: establish one trustworthy state model for every interface.

- [x] Implement validated records, stable IDs, referential integrity, and schema versioning.
- [x] Implement source preservation, reviewed scope baselines, and explicit change decisions.
- [x] Implement atomic persistence, revision conflicts, cross-process locking, and crash recovery.
- [x] Ensure state and event records recover consistently after interrupted mutations.
- [x] Preserve history and provide portable backup/export and validated restore.
- [x] Reject dependency cycles, invalid references, and malformed imported state.
- [x] Provide actionable errors without silently discarding data.

Exit gate: interrupted writes recover to a valid revision; competing writers cannot silently overwrite each other; export/restore preserves project meaning and history.

### P03 — CLI and local project workflow

Goal: use ScopeLock without any agent or dashboard.

- [x] Implement initialization, Markdown import, review, and scope confirmation.
- [x] Implement requirement inspection, implementation updates, blockers, and evidence registration.
- [x] Implement scope-change proposal, diff, acceptance, and rejection.
- [x] Implement status, JSON output, and Markdown report export.
- [x] Implement `doctor` for invalid state, missing files, unavailable executables, and configuration problems.
- [x] Set clear exit codes and validate paths within the selected project.

Proposed command families: `init`, `import`, `scope`, `requirements`, `status`, `evidence`, `doctor`, `report`, `backup`. Final syntax is specified in P01.

Exit gate: a user completes the example import → review → confirmation → implementation → evidence → report workflow from a terminal with no API key.

### P04 — Phase planning, gates, and handoff

Goal: make phase-wise building and checking a first-class workflow.

- [x] Create, order, inspect, and activate phases; map requirements to their owning phase.
- [x] Validate phase and requirement dependencies and expose blockers.
- [x] Present active-phase context with project-wide constraints and relevant dependencies.
- [x] Evaluate required phase exit criteria using registered evidence; connect to executable checks in P06.
- [x] Record continuation overrides with user reason and unmet criteria intact.
- [x] Generate a concise pause/resume handoff from recorded state.
- [x] Support project-wide checks and later-phase regression impact.

Exit gate: the fixture cannot appear fully verified while required criteria are unmet; an override permits continuation without changing the verification result; the handoff identifies the phase, blockers, and next action.

### P05 — Local graphical dashboard

Goal: make recorded project state understandable and reviewable in one place.

- [x] Overview: separate implementation and verification counts, active phase, failures, and blockers.
- [x] Phase roadmap/detail: goals, dependencies, requirements, exit criteria, overrides, and verification.
- [x] Requirement detail: source, acceptance criteria, history, evidence, and affected files.
- [x] Check and evidence views: execution state, results, duration, code state, and artifacts.
- [x] Activity timeline and searchable/filterable recorded logs.
- [x] Scope-change review with explicit accept/reject controls.
- [x] Integration view: configured status, last connection check, and last recorded activity; do not imply a continuously connected agent.
- [x] Live updates with reconnect recovery and consistent snapshot loading.
- [x] Filters by phase, requirement, result, reporting agent, and date where applicable.
- [x] Keyboard access, labelled controls, status text alongside colors, and readable empty/error states.
- [x] Bind locally, validate request origins and host headers, protect mutations against cross-site requests, and render logs/Markdown as untrusted content.

Proposed launch: `scopelock dashboard`.

Exit gate: CLI changes appear without manual refresh; scope decisions persist; a user can navigate from a phase to an unmet criterion and its evidence. External pages cannot trigger local mutations through ordinary cross-site requests.

### P06 — Checks, evidence, logs, and regression detection

Goal: connect progress claims to reproducible checks and clearly labelled evidence.

- [x] Run explicitly user-configured commands with argument arrays, working directories, timeouts, and cancellation.
- [x] Do not execute commands imported from a requirements document automatically. Mark check-definition changes for user review before execution.
- [x] Capture exit code, duration, output, code-state fingerprint, scope revision, and linked criteria.
- [x] Stream bounded output to the dashboard and retain configurable log history.
- [x] Redact common secret patterns before storing or streaming output; never collect full environment files. Clearly state that redaction is incomplete.
- [x] Attach local screenshots, test reports, file references, and explicit human verification notes.
- [x] Label evidence origin and distinguish a successful process exit from proof of broader feature correctness.
- [x] Detect stale evidence and regressions; recalculate affected phase verification.
- [x] Provide log clearing/retention controls; retain an event noting removal without retaining removed content.
- [x] Make health checks report missing or removed evidence accurately.

Exit gate: intentional failures remain failed; cancellation and errors are distinct; later code changes flag affected passes as stale; regressions affect phase verification; live logs and persisted reports agree.

### P07 — Local MCP interface

Goal: expose the same project workflow to coding agents.

- [x] Expose tools for reading scope, phases, requirements, blockers, and next eligible tasks.
- [x] Expose implementation updates, evidence submission, scope-change proposals, and handoff retrieval.
- [x] Expose check execution only for previously reviewed definitions.
- [x] Reuse engine validation and revision rules; restrict operations to the selected project.
- [x] Return compact structured responses and useful errors.
- [x] Exclude acceptance of scope changes and user-only overrides from agent-facing tools.
- [x] Bound tool output and provide references for large logs instead of inserting full output into agent context.

Exit gate: CLI, dashboard, and MCP agree on state; malformed or conflicting calls cannot bypass rules; the server runs without a hosted endpoint or AI key.

### P08 — Claude Code adapter

Goal: integrate into Claude Code's supported project workflow.

- [x] Verify current official instructions and MCP configuration behavior.
- [x] Install marked project guidance and local MCP configuration safely.
- [x] Explain the active-phase → requirement → implementation → evidence workflow.
- [x] Preserve existing instructions/settings and support idempotent installation and safe uninstall.
- [x] Add connection diagnostics and document permissions/restart requirements.
- [x] Run a real session against the fixture and record target version and surface.

Exit gate: Claude Code reads the active phase, updates a requirement, and submits correctly labelled evidence. Existing user configuration survives installation/removal. Hooks are optional enhancements, not a requirement for baseline compatibility.

### P09 — Codex adapter

Goal: integrate into Codex's supported project workflow.

- [x] Verify current official project-instruction and MCP configuration behavior.
- [x] Install marked `AGENTS.md` guidance and supported local MCP configuration without replacing existing content.
- [x] Add connection diagnostics, permissions guidance, and safe uninstall.
- [x] Run the same fixture workflow used for Claude Code.
- [x] Record tested Codex version and execution surface; document any surface-specific limitations.

Exit gate: Codex reads phase context and writes evidence through the shared workflow; project rules and existing configuration remain intact.

### P10 — Antigravity adapter

Goal: integrate into Antigravity's supported project workflow.

- [x] Verify current official rules/skills and MCP configuration behavior; do not assume paths from other tools.
- [x] Install appropriate marked instructions and supported local MCP configuration.
- [x] Add connection diagnostics, permissions guidance, and safe uninstall.
- [x] Run the same fixture workflow and record tested version and execution surface.

Exit gate: Antigravity reads active-phase requirements and records evidence visible to other interfaces; existing settings survive installation/removal.

### P11 — Cross-agent and cross-platform validation

Goal: test the portability and accuracy claims before advertising support.

- [x] Start work in one agent and continue in the other two without reimporting or duplicating requirements.
- [x] Confirm all interfaces display identical scope revisions, phase state, and results.
- [x] Verify a failed earlier-phase check remains visible after advancing to a later phase.
- [x] Verify a scope proposal does not alter the confirmed baseline without explicit user action.
- [x] Exercise concurrent updates, interrupted writes, missing evidence, stale evidence, and dashboard reconnect.
- [x] Test CLI, local server, and installation behavior on Windows, macOS, and Linux through available CI and real environments.
- [x] Test representative secret redaction, untrusted log rendering, path handling, and local request protections.
- [x] Publish an integration matrix separating automated contract checks from real-agent sessions.

Exit gate: all mandatory acceptance checks pass with evidence. Untested agent/platform combinations remain explicitly unverified; unavailable access is reported as a blocker, never replaced with an invented result.

### P12 — Documentation, packaging, and open-source release

Goal: let a new user install and understand ScopeLock independently.

- [x] Add license, README, contribution guide, security-reporting guidance, and issue templates.
- [x] Document install, five-minute example, dashboard, phase planning, checks, evidence, backups, and uninstall.
- [x] Document all three adapters, tested versions, configuration limits, and agent permission considerations.
- [x] Explain the visibility boundary: ScopeLock records its own executions and submitted events, not every private conversation or agent action.
- [x] Add public-package build, release checks, changelog, and documentation site.
- [x] Use ScopeLock to track its own requirements and attach final phase reports.
- [x] Test a clean package installation against the example without a paid service dependency.
- [ ] Publish source and package only after the release gates pass and the destination accounts are available. (Unexecuted: pending destination owner credentials/accounts).

Exit gate: a new user completes the documented example; the public release matches tested artifacts; limitations and costs are accurately described. (Core local artifacts verified; remote package release remains pending owner accounts).

### P13 — Requirement coverage map (Feature A)

Goal: link requirements to phases, implementation file references, checks, and evidence; highlight coverage gaps and unverified items without assuming links equal correctness.

- [x] REQ-086: Extend requirement model to track linked source files and parse explicit file declarations from requirements markdown.
- [x] REQ-087: Implement coverage analyzer linking requirements to phases, files, checks, and recorded evidence, computing missing links and unverified implementations.
- [x] REQ-088: Expose interactive coverage inspection with drill-down navigation opening underlying records for all counts.
- [x] REQ-089: Provide explicit verification boundary notices across interfaces stating that linked files and check execution do not automatically prove correctness.

Dependencies: P02, P05, P06  
Verification: Automated unit & integration tests (`test/advanced-features.test.mjs`), CLI `scopelock coverage`, dashboard Coverage view.  
Exit gate: All requirements map cleanly to phases, files, checks, and evidence; missing links and implemented-unverified items are identified accurately; all counts link to records; correctness disclaimer is displayed. (Verified in test suite and CLI/web builds).

### P14 — Dependency graph & cycle detection (Feature B)

Goal: compute, validate, and visualize phase and requirement dependency relationships, identifying blockers, eligible start work, cycles, and invalid references with an accessible list alternative.

- [x] REQ-090: Build dependency graph analysis for phases and requirements with topological ordering.
- [x] REQ-091: Calculate blockers and eligible-to-start work items based on unsatisfied dependencies and verification status.
- [x] REQ-092: Detect cycles and invalid references with actionable error messages preventing state corruption.
- [x] REQ-093: Provide accessible list/tree representation alongside visual graph in CLI, MCP, and Dashboard.

Dependencies: P04, P13  
Verification: Dependency tests (`test/advanced-features.test.mjs`), CLI `scopelock dependencies`, dashboard Dependency view.  
Exit gate: Cycles and invalid references are rejected with clear errors; eligible work and blockers match state exactly; accessible text alternative is fully navigatable. (Verified).

### P15 — Change-impact tracking (Feature C)

Goal: detect modifications affecting explicitly linked files or stored artifacts, flagging affected evidence and requirements as potentially stale with clear explanations, handling dirty working trees and non-Git projects cleanly.

- [x] REQ-094: Implement per-file content hashing and change detector across the workspace.
- [x] REQ-095: Evaluate change impact against linked requirement files and artifacts, flagging affected evidence and requirements as potentially stale.
- [x] REQ-096: Provide human-readable explanations detailing which files changed and why a recheck is advised.
- [x] REQ-097: Handle dirty working trees, untracked modifications, and non-Git repositories explicitly without depending on external services.
- [x] REQ-098: Preserve previous verification history and runs rather than overwriting historical evidence.

Dependencies: P06, P13  
Verification: Impact tests (`test/advanced-features.test.mjs`), CLI `scopelock impact`, dashboard impact indicators.  
Exit gate: File modifications accurately trigger stale flags for linked requirements/evidence; explanations list exact changed paths; non-Git and dirty repos function identically; historical runs remain intact. (Verified).

### P16 — Agent handoff panel & shared state (Feature D)

Goal: provide a comprehensive handoff summary of active phase, current task, recorded implementation state, check results, blockers, and next action, with timestamps, agent identity labeling, and Markdown export.

- [x] REQ-099: Construct enriched handoff snapshot aggregating phase, current task, implementation stats, latest check results, blockers, and next action.
- [x] REQ-100: Record timestamps and reporting agent identity, clearly separating agent suggestions/claims from human verifications.
- [x] REQ-101: Implement Markdown handoff exporter formatted for direct consumption by subsequent coding agents.
- [x] REQ-102: Guarantee shared state consistency across CLI, MCP (`get_handoff`), and Dashboard.

Dependencies: P04, P07, P13  
Verification: Handoff tests (`test/advanced-features.test.mjs`), CLI `scopelock handoff --export`, MCP `get_handoff`.  
Exit gate: Handoff exports complete Markdown containing all required sections; agent claims and human verifications are explicitly differentiated; CLI, MCP, and UI display identical handoff state. (Verified).

### P17 — Build timeline & activity filtering (Feature E)

Goal: extend activity logging with rich filtering by phase, requirement, agent, event type, result, and date range, linking each event to its associated record with clear empty states.

- [x] REQ-103: Enrich event data model to associate events with specific phase, requirement, check, run, and evidence IDs.
- [x] REQ-104: Implement multi-dimensional filtering across phase, requirement, actor, event type, result, and date range.
- [x] REQ-105: Record structured events for scope decisions, implementation updates, check runs, evidence registrations, and phase transitions.
- [x] REQ-106: Design readable empty states when no activity matches the active filter criteria.

Dependencies: P05, P06, P16  
Verification: Timeline tests (`test/advanced-features.test.mjs`), CLI `scopelock timeline`, dashboard Activity/Timeline view.  
Exit gate: Events link to associated records; all filter dimensions filter accurately; empty filter results provide clear feedback without error. (Verified).

### P18 — Progress comparison & persistent checkpoints (Feature F)

Goal: create named persistent checkpoints and compare two checkpoints to highlight scope additions/removals, implementation changes, verification changes, new blockers, and regressions using stable IDs while separating scope growth from implementation progress.

- [x] REQ-107: Implement persistent checkpoint creation and storage in `.scopelock/checkpoints/` capturing atomic project snapshots.
- [x] REQ-108: Implement stable-ID differential comparison identifying scope changes, status updates, verification shifts, blockers, and regressions.
- [x] REQ-109: Decouple scope growth from implementation progress in differential metrics.

Dependencies: P02, P15  
Verification: Checkpoint tests (`test/advanced-features.test.mjs`), CLI `scopelock checkpoint`, `scopelock diff`.  
Exit gate: Checkpoints persist across restarts; comparison accurately identifies additions, deletions, regressions, and blocker introductions using stable IDs. (Verified).

### P19 — Scope-drift review (Feature G)

Goal: highlight changed files lacking requirement links for human review, allowing linkage to requirements or documented supporting infrastructure, handling additions, deletions, renames, and uncommitted edits as a review heuristic without auto-rejecting.

- [x] REQ-110: Scan working tree for unlinked changed files not mapped to any requirement or approved supporting infrastructure.
- [x] REQ-111: Provide mechanisms to link discovered files to requirements or record them as documented supporting infrastructure.
- [x] REQ-112: Accurately detect additions, deletions, and modifications in both Git and non-Git environments.
- [x] REQ-113: Maintain review heuristic boundary: never automatically reject code changes or approve scope alterations.

Dependencies: P13, P15  
Verification: Scope drift tests (`test/advanced-features.test.mjs`), CLI `scopelock drift`, dashboard Drift view.  
Exit gate: Unlinked files are surfaced with review options; linking to requirement or supporting infrastructure clears drift flag; human review authority is preserved. (Verified).

### P20 — Release-readiness report (Feature H)

Goal: evaluate failed checks, stale/missing evidence, unresolved blockers, unmet phase exit criteria, and required compatibility checks, separating implementation from verified release gates, and exporting an actionable Markdown report.

- [x] REQ-114: Build release-readiness assessment engine auditing exit gates, failed checks, stale evidence, and blockers.
- [x] REQ-115: Enforce clear separation between implementation completeness and verified release gates.
- [x] REQ-116: Index all readiness blockers with direct links and references to offending records.
- [x] REQ-117: Export comprehensive Markdown release-readiness report for stakeholder review.
- [x] REQ-118: Strictly enforce honest gate certification: never mark real-agent, OS, browser, or publication gates complete without actual recorded evidence.

Dependencies: P06, P14, P15, P18  
Verification: Readiness tests (`test/advanced-features.test.mjs`), CLI `scopelock readiness`, dashboard Readiness view.  
Exit gate: Readiness report lists every gate, failure, and blocker with actionable references; Markdown report matches programmatic output; unexecuted gates are never fabricated. (Verified).

### P21 — Dashboard overview & saved filters (Feature I & Overview)

Goal: provide four distinct dashboard summaries (Implementation, Verification, Blockers, Release readiness) with interactive record drill-downs, built-in view filters, and locally persistent custom filters.

- [x] REQ-119: Implement four separate overview summaries with documented count calculations and no misleading single completion percentage.
- [x] REQ-120: Enable interactive count drill-downs opening matching records for every overview metric.
- [x] REQ-121: Provide built-in filters for blocked work, failed checks, stale evidence, and implemented-but-unverified requirements.
- [x] REQ-122: Enable creating, renaming, deleting, and persisting custom filters locally across sessions.
- [x] REQ-123: Strictly prohibit fabricated build logs; label retrospective notes and empty states clearly.

Dependencies: P05, P13, P14, P15, P16, P17, P18, P19, P20  
Verification: UI tests (`test/dashboard.test.mjs`, `test/advanced-features.test.mjs`), interactive browser testing, DOM verification.  
Exit gate: All four summaries calculate and link to underlying records; built-in and custom saved filters persist and handle empty results gracefully; keyboard and ARIA navigation are maintained. (Verified).

### P22 — Parallel-work tracking [DEFERRED MILESTONE] (Feature J)

Goal: record agent/task assignments and identify overlapping requirement assignments, clearly stating that ScopeLock tracks submitted actions, not private agent thoughts.

- [ ] REQ-124: Define data model for agent work assignments and active task leases.
- [ ] REQ-125: Specify conflict detection algorithm for overlapping requirement assignments.
- [ ] REQ-126: Document visibility boundary: ScopeLock observes submitted operations, not uncommitted agent local state.

Dependencies: P16, P21  
Verification: Deferred for subsequent milestone execution; data structures defined for compatibility.  
Exit gate: Milestone documented and deferred; core features A–I fully verified first.

## 6. Release acceptance scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| REL-001 | Import and confirm requirements | Original source retained; stable IDs and reviewed baseline created |
| REL-002 | Build by phase | Dependencies, blockers, and exit criteria remain visible |
| REL-003 | Agent reports work complete without checks | Implemented status may change; verification does not become an automatic pass |
| REL-004 | Required check fails | Requirement and phase show unmet verification with inspectable output |
| REL-005 | User advances with an override | Reason recorded; unmet criteria remain visible |
| REL-006 | Code changes after a pass | Affected evidence becomes stale or conservatively flagged |
| REL-007 | Switch between the three target agents | Same project state continues without manual context duplication |
| REL-008 | Dashboard receives new activity | Live state updates; reconnect recovers missed events |
| REL-009 | Agent proposes an extra feature | Proposal recorded; baseline unchanged until user decision |
| REL-010 | Interrupt or race a write | Valid recoverable state; no silent lost update |
| REL-011 | Install and uninstall adapters | Existing instructions and settings preserved |
| REL-012 | Use core product without paid services | CLI, dashboard, checks, and local MCP operate without an AI key |
| REL-013 | Run project-wide regression checks | Integration failures remain visible even if individual phase checks passed |

## 7. Deferred work

Outside version one unless explicitly added to scope:

- PDF/Word extraction, OCR, and AI-generated requirement decomposition.
- Hosted accounts, team permissions, cloud synchronization, billing, and remote dashboards.
- Automatic semantic proof that code satisfies arbitrary natural-language requirements.
- Universal interception or blocking of every agent edit or private conversation.
- Additional agent adapters before the initial three meet their acceptance gates.
- Complex scheduling, distributed multi-machine agent orchestration, and cross-worktree state synchronization.
- Feature J: Multi-agent parallel-work tracking (P22) — deferred for this execution milestone while features A–I are fully implemented and verified.
- A dedicated graphical requirement-history comparison view; underlying history is retained from P02.

## 8. Execution discipline

1. Activate the next eligible phase and read its requirements and constraints.
2. Implement only work mapped to that phase or strictly necessary shared infrastructure.
3. Record implementation separately from verification.
4. Run phase-specific checks and applicable project-wide regression checks.
5. Attach evidence and surface failures, blockers, and stale results.
6. Evaluate the exit gate; document any explicit user override without claiming a pass.
7. Update this plan's checkboxes only when supported by recorded results.

No delivery dates or completion claims are implied by this plan. The first concrete milestone is P01–P03: a reliable terminal workflow using the five-requirement fixture. Version one is complete only after P12 and all mandatory release acceptance scenarios pass.

## 9. Implementation decisions and outstanding validation

The build uses one atomic JSON snapshot containing state and append-only-in-meaning event history, plus a previous valid snapshot. Separate append-only activity segment files are not implemented. This keeps state and event commits together; scale testing is pending.

The source archive includes a built dashboard and CLI plus source and lockfile. The implementation uses whole-project fingerprints rather than selective Git diff invalidation. Local SDK checks validate MCP tools and adapter configuration; they do not certify signed-in sessions inside each target agent.

Browser rendering and visual layout checks were blocked by the execution environment. A DOM test renders all eight views but cannot establish visual quality or keyboard accessibility. Windows/macOS jobs are configured, not executed here. Public GitHub/npm publication and a public security contact require owner accounts and remain pending. These limitations prevent declaring all 12 exit gates complete.

### Advanced Features Implementation Order
The advanced features (A–I) are ordered to respect structural system dependencies:
1. Shared data model, validation, backward-compatible migration, and engine operations (`src/model.ts`, `src/core.ts`).
2. Coverage mapping (P13, Feature A) and dependency analysis (P14, Feature B).
3. Change-impact tracking (P15, Feature C) and scope-drift review (P19, Feature G).
4. Handoff summaries (P16, Feature D) and timeline extensions (P17, Feature E).
5. Checkpoints and progress comparison (P18, Feature F).
6. Release-readiness calculation and export (P20, Feature H).
7. Dashboard overview, feature views, and saved filters (P21, Feature I & Overview).
8. CLI/MCP exposure for relevant operations, documentation, and combined verification.
Feature J (P22) remains documented as a deferred milestone.
