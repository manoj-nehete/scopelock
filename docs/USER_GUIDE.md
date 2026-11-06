# ScopeLock — User Guide & Quickstart

Welcome to **ScopeLock**! This guide will take you from zero to tracking your first project with AI coding agents in under 5 minutes.

---

## Table of Contents
1. [What is ScopeLock?](#1-what-is-scopelock)
2. [Key Concepts](#2-key-concepts)
3. [Quickstart in 3 Minutes](#3-quickstart-in-3-minutes)
4. [Writing a Requirements Document](#4-writing-a-requirements-document)
5. [Connecting Your AI Agents](#5-connecting-your-ai-agents)
   - [Antigravity IDE](#antigravity-ide)
   - [Claude Code](#claude-code)
   - [OpenAI Codex](#openai-codex)
6. [Checks, Evidence & Verifications](#6-checks-evidence--verifications)
7. [Multi-Agent Collaboration & Handoffs](#7-multi-agent-collaboration--handoffs)
8. [CLI Command Reference](#8-cli-command-reference)
9. [Troubleshooting & Diagnostics](#9-troubleshooting--diagnostics)

---

## 1. What is ScopeLock?

ScopeLock is a free, local-first open-source tool designed to keep AI coding agents (such as Antigravity, Claude Code, and Codex) strictly aligned with agreed project goals.

### The Problem ScopeLock Solves:
When working with AI coding agents:
- Agents often jump ahead and implement later features prematurely.
- Agents claim a task is "done" without executing verifiable tests.
- Switching between agents loses context and duplicates prompts.
- Code changes inadvertently break earlier features (silent regressions).

### How ScopeLock Solves It:
- **Phase-by-Phase Gates:** Work is divided into sequential phases. Agents cannot mark a phase complete until all required exit criteria pass.
- **Evidence-Based Verification:** An agent's note never counts as proof. Only verified automated test runs or explicit human attestations verify a requirement.
- **Unified Local MCP Hub:** Agents communicate with ScopeLock via the Model Context Protocol (MCP), reading active phase goals, constraints, and handoff instructions.
- **Local Graphical Dashboard:** Inspect project state, test logs, requirements, and agent proposals in real-time.

---

## 2. Key Concepts

Understanding ScopeLock takes just four terms:

```
Project ──► Phases ──► Requirements ──► Acceptance Criteria ──► Checks & Evidence
```

1. **Phase:** A milestone in your roadmap (e.g., `P01: Foundation`, `P02: UI Components`). Phases can depend on earlier phases.
2. **Requirement:** A specific feature or capability (e.g., `REQ-001: User Login`). Each requirement belongs to one phase.
3. **Acceptance Criterion:** The concrete testable condition that proves a requirement is met (can be `automated` or `manual`).
4. **Evidence & Checks:** 
   - A **Check** is an executable command (like `npm test` or a script) linked to criteria.
   - **Evidence** is the timestamped record of an approved check run or human review.
   - **Important rule:** *Implementation* (`not_started`, `in_progress`, `implemented`) is tracked separately from *Verification* (`not_checked`, `passed`, `failed`, `stale`).

---

## 3. Quickstart in 3 Minutes

### Step 1: Install ScopeLock CLI

ScopeLock runs locally with Node.js (version 24+ recommended):

```bash
# Clone the repository
git clone https://github.com/manoj-nehete/scopelock.git
cd scopelock

# Install dependencies and build
npm ci
npm run build

# Make 'scopelock' available globally on your system
npm link
```

Verify your installation:
```bash
scopelock --help
```

---

### Step 2: Initialize in Your Project

Navigate to any project directory where you want to track agent work:

```bash
cd /path/to/my-awesome-project

# Initialize ScopeLock
scopelock init "My Awesome Project"
```

This creates a local `.scopelock/` directory containing your project state journal.

---

### Step 3: Import & Confirm Requirements

Create a simple `requirements.md` file (or import an existing one):

```bash
# Import your requirements
scopelock import requirements.md

# Inspect the imported scope
scopelock status

# Lock the baseline scope
scopelock confirm
```

Once confirmed, ScopeLock establishes a versioned scope baseline. Agents cannot silently modify this baseline without proposing changes for your review.

---

### Step 4: Launch the Dashboard

```bash
scopelock dashboard
```

Open your browser to `http://127.0.0.1:4317`. You will see the local real-time dashboard displaying:
- **Overview:** Implementation vs. verification counts, active phase, and failures.
- **Phases:** Roadmap progress and exit gates.
- **Requirements:** Full hierarchy, acceptance criteria, and history.
- **Checks & Logs:** Live check outputs, exit codes, and durations.
- **Integrations:** Connected agent statuses and diagnostic probes.

---

## 4. Writing a Requirements Document

ScopeLock parses clean, readable Markdown documents. Here is the standard format:

```markdown
# Phase P01: Core Architecture
- Constraint: Use zero external cloud databases.

## REQ-001: User Registration
- Acceptance: Registration succeeds with a valid email and 8+ character password.

## REQ-002: Reject Duplicate Accounts
- Depends: REQ-001
- Acceptance: Attempting to register an existing email returns HTTP 409 Conflict.

# Phase P02: User Experience
- Phase depends: P01

## REQ-003: Password Strength Indicator
- Depends: REQ-001
- Acceptance (manual): Human verifies visual indicator changes dynamically on keyboard input.
```

### Key Syntax Rules:
- `# Phase ID: Title` declares a phase.
- `- Phase depends: ID` establishes phase prerequisites.
- `## REQ-ID: Title` declares a requirement.
- `- Depends: REQ-ID` establishes requirement dependencies.
- `- Acceptance: Description` defines an automated criterion.
- `- Acceptance (manual): Description` specifies a human attestation requirement.

---

## 5. Connecting Your AI Agents

ScopeLock includes dedicated adapters for popular agent tools. Adapters configure project instructions and local MCP endpoints safely without overwriting your existing settings.

### Antigravity IDE
In your project directory, run:
```bash
scopelock connect antigravity
```
* **Installed files:** `.agents/mcp_config.json` and `.agents/rules/scopelock.md`.
* **Verification:** Run `scopelock probe antigravity` to confirm that all 10 MCP tools are discovered.

### Claude Code
In your project directory, run:
```bash
scopelock connect claude-code
```
* **Installed files:** Managed block in `CLAUDE.md` and server entry in `.mcp.json`.
* **Verification:** Run `scopelock probe claude-code`.

### OpenAI Codex
In your project directory, run:
```bash
scopelock connect codex
```
* **Installed files:** Managed block in `AGENTS.md` and server configuration in `.codex/config.toml`.
* **Verification:** Run `scopelock probe codex`.

### Safe Uninstallation
To cleanly disconnect an agent and restore your original configuration files byte-for-byte:
```bash
scopelock disconnect antigravity
```

---

## 6. Checks, Evidence & Verifications

ScopeLock enforces strict security boundaries around code verification:

### 1. Defining a Check
Check definitions link commands to acceptance criteria. Example `check-user.json`:
```json
{
  "id": "CHECK-001",
  "title": "Registration unit tests",
  "criteria": ["REQ-001-AC1"],
  "command": "npm",
  "args": ["test", "--", "registration.test.js"],
  "cwd": ".",
  "timeoutMs": 15000
}
```

Store the check definition:
```bash
scopelock check define check-user.json
```

### 2. Human Approval (Security Gate)
Because commands run with your local permissions, **an unapproved check cannot be executed by an AI agent**. A human must explicitly review and approve it:
```bash
scopelock check approve CHECK-001
```
*(Or click "Approve" directly on the web dashboard).*

### 3. Running Checks & Submitting Evidence
Once approved, either run it manually or let your agent execute it:
```bash
scopelock check run CHECK-001
```
When the check succeeds, ScopeLock registers evidence tied to your current code fingerprint. If code changes later, ScopeLock flags affected evidence as `stale` to guard against regressions.

---

## 7. Multi-Agent Collaboration & Handoffs

One of ScopeLock's greatest strengths is seamless context handoff between different agents:

```
[ Claude Code ]          [ OpenAI Codex ]          [ Antigravity ]
  Implements REQ-001  ──►  Implements REQ-002  ──►  Completes REQ-003
        │                         │                        │
        └─────────────────────────┴────────────────────────┘
                                  ▼
                  Single ScopeLock Journal (.scopelock)
```

1. **Agent 1 (e.g. Claude Code)** starts working on Phase `P01`. It calls `get_handoff` via MCP, implements `REQ-001`, runs the approved check, and submits evidence.
2. **Switching to Agent 2 (e.g. Codex):** You open Codex in the same workspace. Codex queries `get_handoff` and immediately sees that `REQ-001` is already verified. It picks up `REQ-002` without you having to re-explain the project.
3. **Completing Phase in Agent 3 (e.g. Antigravity):** Antigravity finishes `REQ-003`. All criteria for `P01` are now satisfied, transitioning Phase `P01` to `passed` and unlocking Phase `P02`.

---

## 8. CLI Command Reference

| Command | Description |
| :--- | :--- |
| `scopelock init [NAME]` | Initialize a new ScopeLock project in current folder |
| `scopelock import <FILE>` | Import a Markdown requirements file |
| `scopelock confirm` | Lock the baseline scope revision |
| `scopelock status` | View current project status summary |
| `scopelock dashboard [PORT]` | Start the local web dashboard (default: 4317) |
| `scopelock handoff` | View active phase, blockers, constraints, and next eligible task |
| `scopelock update <REQ-ID> <STATUS>` | Update requirement status (`not_started`, `in_progress`, `implemented`, `blocked`) |
| `scopelock phase activate <PHASE-ID>` | Advance to a phase (requires dependencies verified, or override reason) |
| `scopelock check define <FILE.json>` | Store a new check definition |
| `scopelock check approve <CHECK-ID>` | Approve a check definition for execution |
| `scopelock check run <CHECK-ID>` | Run an approved check |
| `scopelock evidence <FILE.json>` | Record manual human evidence or artifact attestation |
| `scopelock scope propose <FILE> <REASON>` | Propose a scope modification |
| `scopelock scope accept <PROP-ID>` | Accept a proposed scope change (increments scope revision) |
| `scopelock scope reject <PROP-ID>` | Reject a proposed scope change |
| `scopelock report [FILE]` | Generate a full Markdown report |
| `scopelock connect <AGENT>` | Install agent adapter (`antigravity`, `claude-code`, `codex`) |
| `scopelock probe <AGENT>` | Test MCP connection diagnostics |
| `scopelock disconnect <AGENT>` | Uninstall agent adapter and restore original configuration |
| `scopelock doctor` | Check project health, missing files, or broken check paths |
| `scopelock backup [FILE]` | Create portable project backup (including evidence artifacts) |
| `scopelock restore <FILE>` | Restore project from backup file |
| `scopelock recover` | Recover from interrupted writes or dead locks |
| `scopelock logs clear [DAYS]` | Prune old execution logs |

---

## 9. Troubleshooting & Diagnostics

### Run Doctor
If something isn't working as expected, run:
```bash
scopelock doctor
```
`doctor` validates:
- State integrity and schema compliance.
- Check executables and working directories.
- Presence of all attached evidence artifact files.
- Active process locks.

### Lock Recovery
If an agent or terminal crashed during a mutation:
```bash
scopelock recover
```
ScopeLock safely removes dead same-host locks and verifies that the previous atomic snapshot remains consistent.

---

*ScopeLock is free and open-source under the MIT License.*  
*Repository:* [https://github.com/manoj-nehete/scopelock](https://github.com/manoj-nehete/scopelock)

