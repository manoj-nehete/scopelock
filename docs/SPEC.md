# ScopeLock v0.1 implementation contract

## Data and identity

The authoritative schema is src/model.ts, schema version 2. Stable IDs identify phases, requirements, criteria, checks, runs, evidence and proposals. Each requirement owns criteria and belongs to one phase. Dependencies must resolve and be acyclic. Check definitions link criterion IDs. Global constraints apply to all phases.

Each mutation increments revision and appends an event in the same atomic JSON snapshot. Scope confirmation and acceptance increment scopeRevision and retain original sources in scopeHistory. Changes to implementation do not change scope or verification. Historical runs and evidence retain their original scope revision.

## Markdown grammar

- `# Phase P01: Title` creates a phase.
- `- Phase depends: P01, P02` attaches dependencies to the most recent phase.
- `## REQ-001: Title` creates a requirement in the current phase.
- `- Acceptance: Text` or `- Acceptance (automated): Text` creates a required automated criterion.
- `- Acceptance (manual): Text` requires a human attestation.
- `- Depends: REQ-001` attaches requirement dependencies.
- `- Constraint: Text` adds a global constraint.

Criterion IDs are requirement ID plus `-AC1`, `-AC2`, etc. At least one criterion per requirement is required. Without phase headings, a single P01 is created. Other prose is preserved in the original source but is not silently treated as a requirement. Review the imported result before confirmation.

## Verification semantics

Implementation statuses are not_started, in_progress, implemented, blocked. Blocked requires a reason. Verification is derived on read: not_checked, passed, failed, stale. Automated criteria use the most recent eligible completed check; manual criteria use the most recent human attestation. Agent submissions are shown but never impersonate human evidence. Failed/error/cancelled runs cannot pass. Running checks do not replace the previous completed evidence.

Fingerprints hash file paths and bytes across the project, including uncommitted/untracked files; exclude .git, .scopelock, node_modules, dist, coverage, .DS_Store, and symlinks. This is conservative whole-project invalidation, not semantic dependency analysis. Changes inside excluded output directories are not independently tracked. A changed scope or fingerprint makes old evidence stale. Changing files during a check makes its evidence stale. Missing manual artifacts invalidate their evidence.

A phase passes only when it has criteria and all required criteria pass. Dependency failures prevent activation unless the user records an override. Overrides permit continuation, never a fabricated pass. Requirement dependencies determine the next eligible task in handoff.

## Interfaces and trust

CLI command grammar is shown by `scopelock --help` (or no arguments). Read responses are JSON; reports are Markdown. Human-only decisions are exposed through CLI/dashboard. Agents receive only the MCP tools in src/mcp.ts: read handoff, requirements, phases, checks and runs; record implementation and agent evidence; propose scope changes; run previously approved checks. Agent labels are self-reported.

MCP is a local stdio server using the official SDK. No cloud endpoint or API key is required. Large responses are bounded; the dashboard retains full stored output. Users' existing agent permissions still apply.

Dashboard routes: `/` serves React; `/api/state` returns current derived state and local mutation token; `/api/events` streams snapshots; `/api/action` accepts authenticated local JSON actions; `/api/report` exports Markdown. Bind loopback only. Validate host/origin; do not allow CORS. Text is rendered as text, never raw HTML. Commands run without a shell only after explicit approval of a stored definition.

## Dashboard layout sketch

Persistent project navigation beside a page header and export action. Overview: four counters, active phase card, recent activity, requirement table. Phases: ordered cards with exit criteria, dependencies and overrides. Requirements: searchable table and details. Checks: reviewed definitions above chronological runs and bounded output. Evidence: human attestation form and provenance-labelled history. Activity: time/actor/revision events. Scope review: current/proposed text with decisions. Integrations: separate installation, local probe and last session timestamps.

## Durability and limitations

Mutations use an exclusive cross-process file lock and same-directory atomic rename, with a previous valid snapshot. Recovery refuses a live or foreign-host lock owner. It is explicitly invoked, not automatic lock stealing. A malformed lock requires inspection. Machine power-loss durability and network filesystems are not certified. JSON snapshots include activity history; separate append-only log segments are deferred pending measured scale needs.

Scope changes replace reviewed Markdown, preserve unchanged implementation metadata, invalidate old evidence through scopeRevision, and require check reapproval. Used check IDs are immutable. Local backups include state and copied evidence artifacts. Restore is intended for a new/empty project.
