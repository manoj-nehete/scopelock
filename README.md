# ScopeLock

**The seatbelt for AI-assisted building. One agreed scope. Every phase. Evidence you can inspect.**

ScopeLock is a free, local-first, open-source alignment engine and project tracker for anyone building applications with AI coding agents. It connects your roadmap, requirement checklists, automated test checks, evidence records, and a local graphical dashboard. 

Built-in adapters for **Antigravity**, **Claude Code**, and **OpenAI Codex** share the exact same project state over local MCP (Model Context Protocol)—with **₹0 cloud costs**, no subscriptions, and 100% privacy on your own machine.

> 📖 **Need the in-depth manual?** See the [Complete User Guide](docs/USER_GUIDE.md).  
> 📋 **Architecture & Roadmap:** See [PLAN.md](PLAN.md) and [BUILD_STATUS.md](BUILD_STATUS.md).  
> 🔗 **Repository:** [https://github.com/manoj-nehete/scopelock](https://github.com/manoj-nehete/scopelock)

---

## 💡 Why Every "Vibe Coded" Project Needs ScopeLock

### What is "Vibe Coding"?
"Vibe coding" is building real software through conversational AI prompts—describing what you want in plain language and letting models like Claude, Codex, Gemini, or Antigravity write the code. It feels like magic, until...

### Why Vibe-Coded Projects Break:
1. **The "Yes Man" Problem:** AI agents enthusiastically claim *"I've implemented everything and it works perfectly!"* when they haven't actually run or verified the code.
2. **Premature Leaping:** You ask for a simple login screen, and the AI tries to build a complex payment gateway or dark-mode theme before the database even works.
3. **Silent Regressions:** The AI fixes a CSS button in Step 5 and accidentally deletes authentication code written in Step 1.
4. **Context Amnesia:** You switch chat windows, start a new session, or switch between Claude, Cursor, and Codex, and the new AI has no idea what was already verified.

### How ScopeLock Keeps You Safe:
- 🛡️ **Implementation ≠ Verification:** An AI saying *"I wrote it"* only marks a task as `implemented`. It **never** counts as verified until an actual test runs or you personally attest to it.
- 🚦 **Sequential Phase Gates:** Phase 2 stays locked until Phase 1's exit criteria actually pass. No jumping ahead.
- 🔍 **Change-Impact & Drift Tracking:** If your AI modifies a file it shouldn't have touched, ScopeLock immediately flags affected features as `stale` and alerts you.
- 🤝 **Universal Agent Handoff:** Export a concise Markdown handoff report anytime. Switch from Claude Code to Codex or Antigravity in one click without losing context.
- 📊 **Honest Visual Dashboard:** A clean, local dashboard showing exactly what's built, what's verified, what's blocked, and whether you're genuinely ready to release.

---

## ⚡ The 3-Step Vibe-Coding Workflow

1. **Write down your ideas in plain English:** List what you want in a simple `requirements.md` file divided into phases.
2. **Let your AI agent build phase by phase:** Connect ScopeLock to your agent via MCP. The agent reads the active phase, works only on eligible tasks, and runs approved checks.
3. **Open the dashboard to see reality:** View your 4 overview summaries, see real test outputs, inspect unlinked file drift, and know exactly what to prompt next.

---

## 🚀 The 0 to 100 Command List

Here is your complete reference guide—from first install to advanced release readiness:

### 0. Installation & Setup
```sh
# Clone and enter directory
git clone https://github.com/manoj-nehete/scopelock.git
cd scopelock

# Install dependencies and build frontend & backend
npm ci
npm run build

# (Optional) Link globally so you can type 'scopelock' anywhere
npm link
```
*(If global link is restricted on your system, replace `scopelock` with `node /path/to/scopelock/dist/cli.js`)*.

---

### 1. Starting a Project (0 → 25)
Get your project organized and lock in your agreed plan.

```sh
# Navigate to your project folder
cd my-cool-app

# 1. Initialize ScopeLock in your project
scopelock init "My Cool App"

# 2. Import your requirements Markdown file
scopelock import requirements.md

# 3. View current imported draft scope
scopelock status

# 4. Lock in your baseline scope (creates Scope Revision 1)
scopelock confirm

# 5. Check project health and verify workspace files
scopelock doctor
```

---

### 2. Coding with Agents & Daily Flow (25 → 50)
Keep coding agents focused on the right task and track progress honestly.

```sh
# Connect your favorite AI coding agents (sets up local MCP automatically)
scopelock connect claude-code     # Configures CLAUDE.md & .mcp.json
scopelock connect codex           # Configures AGENTS.md & .codex/config.toml
scopelock connect antigravity     # Configures .agents/rules/ & MCP

# Test local agent connection diagnostics
scopelock probe antigravity

# Get the immediate handoff context (what to do right now)
scopelock handoff

# Export handoff as Markdown to paste into any new chat or prompt
scopelock handoff --export handoff.md

# Update a requirement's implementation status
scopelock update REQ-001 in_progress
scopelock update REQ-001 implemented

# Mark an item blocked with an explicit reason
scopelock update REQ-002 blocked "Awaiting third-party API keys"
```

---

### 3. Verification & Evidence (50 → 75)
Never accept an agent's claim without proof.

```sh
# Define a reproducible command check (stored in a JSON file)
scopelock check define test-check.json

# View all check definitions
scopelock check

# Explicitly review and approve a check command (security guardrail)
scopelock check approve CHECK-001

# Run the approved check (records output, exit code, and code fingerprint)
scopelock check run CHECK-001

# Record a manual human verification (e.g., visual layout or UX check)
scopelock evidence manual-check.json

# Activate a new phase after dependencies pass (or provide override reason)
scopelock phase activate P02
scopelock phase activate P02 "Proceeding with mock database while waiting for staging"
```

---

### 4. Advanced Alignment, Drift & Release (75 → 100)
Catch hidden bugs, inspect scope drift, and audit release readiness.

```sh
# 1. Requirement Coverage Map: see linked files, checks, evidence & gaps
scopelock coverage

# 2. Dependency Graph: view blockers, prerequisites & eligible-to-start tasks
scopelock dependencies
scopelock dependencies --list      # Accessible screen-reader / text format

# 3. Change-Impact Tracking: check if recent edits made previous tests stale
scopelock impact

# 4. Scope-Drift Review: find unlinked files created by your AI
scopelock drift

# Link an unlinked file to an existing requirement
scopelock drift link REQ-001 src/utils.ts

# Document an unlinked file as supporting infrastructure (e.g. config)
scopelock drift supporting vite.config.ts "Vite frontend build configuration"

# 5. Checkpoints & Progress Comparison: compare milestone progress
scopelock checkpoint create "v0.1-Alpha" "Baseline before refactor"
scopelock checkpoint list
scopelock checkpoint compare CKPT-001 current

# 6. Build Timeline: filter activity by phase, requirement, agent, or date
scopelock timeline --phase P01
scopelock timeline --actor claude-code
scopelock timeline --date 2026-11-11

# 7. Release-Readiness Report: audit blockers, unmet gates & export Markdown
scopelock readiness
scopelock readiness --export readiness-report.md

# 8. Manage Saved Filters: create quick search views
scopelock filters list
scopelock filters save "Needs Attention" requirements

# 9. Backup & Safety
scopelock backup my-project-backup.json
scopelock restore my-project-backup.json
scopelock recover                  # Recovers from interrupted writes or dead locks
scopelock logs clear 14            # Keep only the last 14 days of execution logs
```

---

### 5. The Visual Dashboard
Prefer a graphical interface? Launch the built-in local dashboard:

```sh
scopelock dashboard 4317
```
Open **http://127.0.0.1:4317** in your browser to inspect:
- **Overview:** 4 separate summaries (Implementation, Verification, Blockers, Release Readiness) with 1-click drill-downs into matching records.
- **Phases & Roadmap:** Visual progress bars, prerequisites, and phase activation controls.
- **Coverage Map:** Clear breakdown of linked files, test checks, and missing evidence.
- **Dependency Flow:** Interactive cards and accessible text lists showing what's eligible to start.
- **Impact & Drift:** Instant visibility into modified files and unlinked code created by agents.
- **Agent Handoff:** 1-click Markdown exporter to continue seamlessly with any AI model.
- **Checkpoints Diff:** Side-by-side comparison of scope growth vs. real implementation progress.
- **Readiness Audit:** Actionable blocker checklists before publishing your application.

---

## 📝 Writing Requirements in Plain English

Save this as `requirements.md` in your project root:

```markdown
# Phase P01: Core Foundations
- Constraint: Store all data locally on the user machine.

## REQ-001: User Profile Creation
- Files: src/user.ts, src/types.ts
- Acceptance (automated): User can be created with valid username and email.

## REQ-002: Password Validation
- Files: src/auth.ts
- Acceptance (automated): Passwords shorter than 8 characters are rejected.

# Phase P02: User Experience
- Phase depends: P01

## REQ-003: Dark Mode Toggle
- Depends: REQ-001
- Files: src/theme.ts
- Acceptance (manual): User can toggle between dark and light themes smoothly.
```

- `# Phase P01: ...` defines a roadmap phase.
- `## REQ-001: ...` defines a stable requirement ID.
- `- Files: ...` links the files your AI is expected to edit.
- `- Acceptance (automated): ...` requires a real command test to pass.
- `- Acceptance (manual): ...` requires you to confirm it looks good.
- `- Depends: ...` ensures the AI doesn't start this until prerequisites pass!

---

## 🔒 Privacy, Security & Cost

- **₹0 Additional Infrastructure:** Runs 100% on your local machine using Node.js.
- **Zero Cloud Leakage:** No ScopeLock servers, no telemetry, no tracking cookies, no accounts.
- **Safe Command Execution:** Agent tools **cannot** execute arbitrary commands without your explicit review and approval in ScopeLock.
- **Secret Redaction:** Command output logs automatically redact common API keys, passwords, and tokens before storing or streaming.

---

## 🛠️ CLI Cheat-Sheet

| Workflow Goal | Command |
| :--- | :--- |
| **Start Project** | `scopelock init [NAME]` → `scopelock import FILE` → `scopelock confirm` |
| **Open GUI** | `scopelock dashboard [PORT]` |
| **What do I do next?** | `scopelock handoff [--export [FILE]]` |
| **Connect AI Agents** | `scopelock connect [claude-code \| codex \| antigravity]` |
| **Test MCP Connection** | `scopelock probe [AGENT]` |
| **Update Progress** | `scopelock update <REQ-ID> [in_progress \| implemented \| blocked]` |
| **Review Test Command**| `scopelock check define FILE.json` → `scopelock check approve <ID>` |
| **Run Real Test** | `scopelock check run <CHECK-ID>` |
| **Audit Test Coverage**| `scopelock coverage` |
| **Check Dependencies**| `scopelock dependencies [--list]` |
| **Did files change?** | `scopelock impact` |
| **Unlinked AI Code?** | `scopelock drift [link REQ FILE \| supporting FILE REASON]` |
| **Milestone Diff** | `scopelock checkpoint create NAME` → `scopelock checkpoint compare ID1 [ID2]` |
| **Release Audit** | `scopelock readiness [--export [FILE]]` |
| **Activity History** | `scopelock timeline [--phase P --actor A --date D]` |
| **Health & Safety** | `scopelock doctor` / `scopelock recover` / `scopelock backup FILE` |

---

## 📄 License

MIT Licensed. Created by Manoj Nehete and ScopeLock contributors.
