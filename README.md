# ScopeLock

**One scope. Every phase. Evidence you can inspect.**

ScopeLock is a free, local-first open-source project tracker for people building with coding agents. It joins a phase roadmap, requirement checklist, command checks, evidence, logs, and a local graphical dashboard. Adapters for **Antigravity**, **Claude Code**, and **OpenAI Codex** expose the same project state over local MCP.

> 📖 **Looking for a step-by-step walkthrough?** Check out the [Complete User Guide](docs/USER_GUIDE.md).  
> 🔗 **GitHub Repository:** [https://github.com/manoj-nehete/scopelock](https://github.com/manoj-nehete/scopelock)

Version 0.1.0 release candidate. See BUILD_STATUS.md for verified results across macOS, Linux, and Windows.

## Requirements

- Node.js 24 or newer and npm.
- Your existing coding-agent access if using an agent integration.
- No ScopeLock account, AI API key, cloud server, or database subscription.

## Install from source

Extract the source archive, open a terminal in the `scopelock` folder, then run:

```sh
npm ci
npm run build
npm link
```

`npm link` installs the local `scopelock` command. If your system restricts global linking, invoke `node /absolute/path/to/scopelock/dist/cli.js` instead; on Windows use your actual Windows path.

## Five-minute example

From the ScopeLock source folder:

```sh
node examples/setup.mjs ../scopelock-demo
scopelock --project ../scopelock-demo dashboard
```

Open the printed address (normally http://127.0.0.1:4317). The example creates five requirements across two phases and four unapproved check definitions. It does not automatically execute them.

1. Click **Requirements**. Open REQ-001 and inspect its criterion. Its verification should say **not checked**.
2. Click **Checks & logs**. Inspect CHECK-001's command and arguments. Click **Approve command**, then **Run check**. A run should appear, followed by **passed** and its output. PASS means the recorded command succeeded; inspect the output and criterion to judge adequacy.
3. Run the approved CHECK-002 and CHECK-003 definitions the same way. Phase P01 should show passed verification after all three pass.
4. Approve and run CHECK-004. Its persistence assertion intentionally fails. The dashboard should show **failed**, with inspectable output. This is a demonstration of accurate failure reporting, not a ScopeLock failure.
5. Click **Phases** and inspect P02. It must not show passed. REQ-005 also needs a real human keyboard-access check; the example has no task UI and cannot pass that criterion yet.
6. If a control is missing, confirm you opened the ScopeLock dashboard for the demo root and expanded the relevant check definition. Refresh once; if it is still absent, record the screen label, command output and project root in a bug report. Do not mark the scenario passed.

## Use with your project

```sh
cd your-project
scopelock init "My project"
scopelock import requirements.md
scopelock status
scopelock confirm
scopelock dashboard
```

Review the imported list before confirming. Keep `.scopelock` private until you have reviewed its contents for sharing. Add it to your project's .gitignore for private projects; a future team workflow can selectively version agreed scope.

Markdown example:

```markdown
# Phase P01: Foundation
## REQ-001: Validate a task title
- Acceptance: Empty titles are rejected.
# Phase P02: Usability
- Phase depends: P01
## REQ-002: Keyboard access
- Depends: REQ-001
- Acceptance (manual): A person can create a task with keyboard-only controls.
```

## Commands

Run `scopelock --help` for the complete grammar. All commands accept `--project PATH` before the command.

- `update REQ-001 implemented`: records implementation, never a verification pass.
- `phase activate P02`: checks dependency verification. An optional reason records an explicit continuation override.
- `handoff`: active phase, constraints, blockers and next eligible requirement.
- `check define check.json`, `check approve CHECK-001`, `check run CHECK-001`: review then run a stored command.
- `scope propose revised.md "reason"`, `scope accept PROP-ID`, `scope reject PROP-ID`: explicit baseline changes.
- `evidence evidence.json`: human attestation with criterion, result, note and optional artifact path.
- `report [FILE]`: phase/requirement verification report.
- `doctor`: state, executables, working directories, evidence and interrupted-run diagnostics.
- `backup FILE`: portable JSON including copied evidence. Store it outside the tracked project so it does not invalidate the code fingerprint.
- `restore FILE`: restore into a fresh/empty project.
- `migrate`: upgrade the earlier schema-v1 preview in place, keeping a legacy backup.
- `recover`: remove a demonstrably dead same-host lock or restore the previous valid snapshot. A live/foreign/unreadable lock is refused.
- `logs clear [DAYS]`: clear finished output or apply age retention.

A check JSON contains `id`, `title`, `criteria` (criterion IDs), `command`, `args`, `cwd` and `timeoutMs`. Definition does not imply approval. A human must review the exact command. Commands execute with your permissions, without a shell. On Windows prefer executable commands such as `node`; shell scripts require an explicitly reviewed shell executable.

## Agent setup

```sh
scopelock connect claude-code
scopelock connect codex
scopelock connect antigravity
scopelock probe codex
```

See docs/INTEGRATIONS.md for configuration locations, permission steps, and tested-vs-unverified distinctions.

## Development

```sh
npm ci
npm run build
npm test
npm pack --ignore-scripts
```

Backend and dashboard have separate strict TypeScript checks. `npm test` runs the combined-system suite after building. CI defines Windows/macOS/Linux jobs; having a CI file does not mean those jobs have run.

## Accurate status

Implemented, verified, failed and stale mean different things. Check results are tied to scope revision and a conservative whole-project fingerprint. Agent notes do not substitute for human verification. Later code changes can make evidence stale. ScopeLock sees its own commands and submitted events; it does not read every agent conversation or intercept every edit.

The dashboard binds to localhost. It is not designed for public hosting. See SECURITY.md and docs/SPEC.md for boundaries, fingerprint exclusions and recovery limitations.

## Project files

PLAN.md contains all 12 phases. docs/REQUIREMENTS.md maps plan tasks to stable build requirements. BUILD_STATUS.md records actual verification and remaining work. MIT licensed.
