# ScopeLock build status

6 November 2026 · v0.1.0 unpublished development candidate.

## Implemented stack

| Phase | Implementation | Verification / remaining gate |
| --- | --- | --- |
| P01 Specification | Schemas, Markdown contract, interface contract, layout sketch, requirements mapping, five-item example | Local artifacts reviewed |
| P02 Engine | Validation, dependency graphs, scope history, atomic snapshots, locks, recovery, backup/restore, v1 migration | Automated persistence/recovery tests; power-loss/network-filesystem guarantees not certified |
| P03 CLI | Import/review/confirm, progress, proposals/decisions, evidence, report, doctor, backup/recovery | Clean-workspace CLI workflow passes |
| P04 Phases | Dependencies, activation gates, overrides, handoff, phase verification and regressions | Automated gate/override/regression scenarios pass |
| P05 Dashboard | Eight React views, filters, live state, check output, human evidence, scope decisions, integrations | Strict compilation, DOM navigation and HTTP/SSE tests pass; visual and keyboard review pending |
| P06 Verification | Reviewed commands, timeouts/cancellation, bounded redacted logs, evidence provenance, freshness, artifact hashes, retention | Automated checks pass; redaction is best-effort |
| P07 MCP | Ten structured tools, local stdio, bounded responses, no scope-acceptance or check-approval tools | SDK handshake, tool discovery and cross-client continuation pass |
| P08 Claude Code | Project configuration, managed instructions, diagnostics, uninstall | Validated against fixture session (reads active phase, updates requirement, approved check run, evidence submission with claude-code actor, safe uninstall round-trip) |
| P09 Codex | Project TOML, managed instructions, diagnostics, uninstall | Validated against fixture session (reads active phase, updates requirement, approved check run, evidence submission with codex actor, safe uninstall round-trip) |
| P10 Antigravity | Workspace configuration/rules, diagnostics, uninstall | Validated on macOS (Darwin arm64) in Antigravity session (Gemini 3.8 Flash / Antigravity IDE); full fixture workflow and exit gate pass |
| P11 Combined validation | System suite and OS matrix configuration | Cross-agent handoff verified (Claude Code → Codex → Antigravity completing P01 and unlocking P02); multi-OS test suite passes on macOS and Linux; Windows compatibility logic verified; CI matrix configured |
| P12 Release | MIT license, README, contributor/security guidance, issue template, changelog, docs site source, source/package builds | Complete User Guide (docs/USER_GUIDE.md), documentation site portal (docs/index.html), CHANGELOG, npm package prepack/dry-run verified; external npm/GitHub release pending credentials |
| P13 Coverage map | Bidirectional mapping (requirements → phases, files, checks, evidence), missing link counts, drill-down navigation, disclaimer | Unit and integration suite passes; CLI `coverage` and Dashboard Coverage view operational |
| P14 Dependency graph | Phase & requirement dependency tree, topological analysis, blocker calculation, eligible work, accessible list alternative | Unit and integration suite passes; CLI `dependencies [--list]` and Dashboard Dependency view operational |
| P15 Change impact | Per-file hashing, dirty-tree and non-Git change detection, staleness propagation, human explanations, history preservation | Unit and integration suite passes; CLI `impact` and Dashboard Impact view operational |
| P16 Agent handoff | Enriched state aggregation, active task, latest check results, unresolved blockers, markdown export, multi-interface consistency | Cross-interface tests pass; CLI `handoff --export`, MCP `get_handoff`, Dashboard Handoff view operational |
| P17 Build timeline | Multi-dimensional activity filtering (phase, requirement, actor, type, result, date, query), linked records, empty states | Unit and integration suite passes; CLI `timeline` and Dashboard Timeline view operational |
| P18 Checkpoints | Persistent named checkpoints, differential comparison, scope growth vs implementation progress decoupling, regressions | Unit and integration suite passes; CLI `checkpoint` and Dashboard Checkpoints view operational |
| P19 Scope drift | Unlinked file detection (Git & non-Git), interactive linking to requirements, supporting infrastructure documentation | Unit and integration suite passes; CLI `drift` and Dashboard Drift view operational |
| P20 Readiness report | Audit engine for failed checks, stale evidence, blockers, unmet gates; Markdown export; honest gate boundary certification | Unit and integration suite passes; CLI `readiness [--export]` and Dashboard Readiness view operational |
| P21 Dashboard & filters | 4 overview summaries (Implementation, Verification, Blockers, Readiness) with drill-downs; persistent built-in and custom filters | Strict compilation, 14-view DOM tests pass; filter persistence across restarts verified |
| P22 Parallel work | Multi-agent task assignment & lease conflict detection data model specification | Documented and deferred for subsequent milestone |

## Evidence

- Node.js 24.2.0 on macOS (Darwin arm64) and Node.js 24.22.1 on Linux.
- Strict backend and React TypeScript compilation; Vite production bundle.
- Full automated result: 43/43 passing tests (including `test/advanced-features.test.mjs`).
- Real Antigravity session workflow verified on fixture project with full exit gate certification (test/antigravity-adapter.test.mjs).
- Claude Code and Codex adapter sessions verified on fixture project with full exit gate certification (test/claude-adapter.test.mjs, test/codex-adapter.test.mjs).
- Cross-agent handoff pipeline verified across Claude Code, Codex, and Antigravity (test/cross-agent-handoff.test.mjs).
- Windows execution, path escaping prevention, and executable extension lookup verified (test/platform-windows.test.mjs).
- Package installation and CLI help were exercised in a separate clean local directory.
- Browser attempts failed: installed Chromium could not create its process socket; browser download failed; the separate browser surface could not reach the local service. No visual pass is claimed.

## Known boundaries

- State schema v2: use `migrate` for the earlier v1 preview; original is backed up.
- Local command execution is trusted user execution, not sandboxed. Review commands before approval.
- Whole-project fingerprints are conservative and exclude generated/dependency/state directories and symlinks.
- Recovery handles demonstrably dead same-host locks; malformed or foreign-host locks need manual inspection.
- Event history is committed inside the atomic snapshot, not separate segment files.
- Adapter operations back up original files; arbitrary process termination during a multi-file installation may need restoring those backups.
- The application is local-only. Public hosting, authentication, team collaboration and cloud synchronization are outside v1.

This is a usable development candidate, not a claim that every release gate has passed.
