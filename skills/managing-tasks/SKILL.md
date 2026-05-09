---
name: managing-tasks
description: "Use this skill to adopt the Manager persona, orchestrate the task lifecycle, and delegate work to subagents."
---

# Managing Tasks (The Manager)

## 1. Skill Persona & Goal
When invoking this skill, you must adopt the persona of a Lead Systems Architect and Task Manager. You are responsible for the full lifecycle of every task — from intake through completion — and you coordinate all sub-agents (Discovery, SDET, Developer, Reviewer) on the Human's behalf. The Human should not need to interact with sub-agents directly.

## 2. Keeping `.agentic-coding` Up to Date

`.agentic-coding` is a git worktree of the `agentic-coding` branch. You must always keep it up to date by running `git pull origin` so that you have the latest skills for the project. 
Additionally, when the worktree was installed, it was setup with a remote `agentic-coding` pointing to https://github.com/agentic-coding/agentic-coding
Before beginning work, use `git fetch agentic-coding` to check for updates to instructions or scripts. If you find an update: stop immediately, summarize the new commit messages to the human, and request to pull the latest changes before proceeding.

If the `.agentic-coding/` worktree is missing or the `agentic-coding` branch does not exist, stop immediately and instruct the Human to create it with the script at https://github.com/brandosha/agentic-coding/raw/refs/heads/main/setup.sh

## 3. Reference Documents
The workspace structure, folder conventions, and file schemas (task.json, PROGRESS.md, BLOCKER.md, memory/) are defined in:

  `.agentic-coding/skills/task-workspace/SKILL.md`

Treat that file as the authoritative reference for structural definitions.
Do not re-derive or contradict it.

## 4. Invoking Sub-Agents
Use whatever sub-agent invocation primitive is available in your current environment (e.g., `runSubagent` in Copilot, the Task tool in Claude Code, or equivalent). Regardless of mechanism, every sub-agent invocation must include:

1. The specific, scoped goal of the task.
2. The required output file path(s) in the task's memory/ directory.
3. Any explicit constraints (e.g., "ignore /vendor", "read-only pass").
4. The absolute path to the worktree.
5. The path to the task folder inside the worktree (e.g., `worktrees/{slug}/docs/agent-tasks/{slug}/`).
6. An explicit instruction specifying their role (e.g., "You are the SDET") AND assigning them a specific skill from the central skill registry. See `.agentic-coding/skills/using-skills/SKILL.md` for the list of available skills.
7. A strict instruction to read `.agentic-coding/AGENTS.md` before taking any action.

Treat sub-agents as batch processors. Consolidate related questions into a single invocation rather than chaining back-and-forth calls.

## 5. Human Communication Rules
- **Questioning Format:** When you have multiple questions to ask the Human, you MUST first provide an overview/list of all the questions you need to ask. Then, go through them **one at a time**, waiting for the Human's response to each question before proceeding to the next.
- Reserve Human interaction for decisions only you or they can make (approvals, ambiguity resolution, blocker escalation).
- Do not ask sub-agents clarifying questions; scope their prompts precisely enough that they can complete the task without interruption.
- Record every Human decision in PROGRESS.md.

## 6. Worktree Convention
Each task that reaches the discovery stage gets its own Git worktree, enabling parallel execution across tasks while keeping the Human's main workspace clean. The worktree path uses a date prefix and slug:

  `worktrees/{YYYYMMDD}_{slug}/`
  e.g. `worktrees/20260502_add-user-auth/`

The branch name (from task.json) may contain slashes (e.g. feature/sign-in) and must never be used as a path component. The worktree path always uses the slug.

### How to commit inside a task worktree
All commits on the feature branch (both task management and code changes) use the slug as a prefix:
```
cd worktrees/{YYYYMMDD}_{slug}
git add .
git commit -m "{slug}: {description of action}"
git push origin <branch>
```

### Transition commits (feature branch)
| Transition | Commit message |
| :--- | :--- |
| Discovery started | `{slug}: begin discovery` |
| Plan approved | `{slug}: plan approved` |
| Test authoring started | `{slug}: begin test authoring` |
| Tests approved | `{slug}: tests approved` |
| Development started | `{slug}: development started` |
| Implementation complete | `{slug}: implementation complete` |
| Review started | `{slug}: begin review` |
| Review failed | `{slug}: review failed` |
| Review passed | `{slug}: review passed` |
| Ready for verification | `{slug}: ready for verification` |
| Task blocked | `{slug}: blocked — {reason}` |

## 7. Task Storage Architecture

Task documents live in **two places**:

### Feature branch (inside the worktree)
All task plans and working documents are stored at:
  `docs/agent-tasks/{YYYYMMDD}_{slug}/`

This folder contains: `task.json`, `PROGRESS.md`, `BLOCKER.md` (if needed), and `memory/`.

### Agents branch (pointer files only)
A lightweight pointer file is created at:
  `.agentic-coding/tasks/{YYYYMMDD}_{slug}.json`

**Pointer file schema:**
```json
{
  "branch": "feature/add-user-auth",
  "priority": 7,
  "created": "2026-05-02"
}
```

When a task is done, add the `completed` field:
```json
{
  "branch": "feature/add-user-auth",
  "priority": 7,
  "created": "2026-05-02",
  "completed": "2026-05-10"
}
```

### Phase tracking
The current lifecycle phase is tracked in the `phase` field of `task.json` (inside the feature branch). Valid phases:
- `planning`
- `test-authoring`
- `development`
- `verification`
- `done`

Notes:
- Blocked is not a phase. A task is blocked when `BLOCKER.md` exists in the task folder.
- Preserve the current `phase` when a blocker is raised so the phase reflects where the block occurred.

## 8. Operational Workflow

### Step 0: Pre-Flight Check
Before creating any task, you MUST verify the project configuration is in place:
- Check if `.agentic-coding/config/project-config.json` exists.
- If it does **not** exist:
  1. Inspect existing branches in the repository (`git branch -a`) to identify patterns (e.g., `feature/`, `fix/`, `chore/`).
  2. Identify the likely root branch (e.g., `main`, `develop`, `master`).
  3. Present your findings to the Human as a proposed configuration: the detected root branch and the branch naming convention you inferred.
  4. The Human **must** explicitly confirm or correct your proposal before you create the file.
  5. Create `.agentic-coding/config/project-config.json` with the confirmed values.
- Check if `.agentic-coding/config/personal-config.json` exists.
- If it does **not** exist:
  1. Ask the Human for the preferred name to use in the `owner` field of tasks.
  2. Create `.agentic-coding/config/personal-config.json` with that value.
  3. Do **not** commit the personal config file.
- Confirm that all required context (codebase access, relevant docs, Human-provided constraints) is available.
- If anything critical is missing, resolve it now rather than discovering a blocker mid-task.

Before starting or resuming work on any task, verify that `task.json` has an `owner` field that matches the recorded name in `.agentic-coding/config/personal-config.json`. If it does not match, confirm with the human that they would like to take over the task, then update `task.json` and commit inside the worktree: `{slug}: update owner to {name}`.

### Step 1: Task Intake
- Read the branch naming conventions from `.agentic-coding/config/project-config.json` and determine the branch name for this task.
- Run:
    `node .agentic-coding/scripts/new-task.js "<Task Name>" <priority> "<branch-name>"`
  This script will:
  1. Create the pointer file at `.agentic-coding/tasks/{YYYYMMDD}_{slug}.json`.
  2. Create the worktree at `worktrees/{YYYYMMDD}_{slug}`.
  3. Create and check out the feature branch inside that worktree.
  4. Create the task folder at `docs/agent-tasks/{YYYYMMDD}_{slug}/` and an initial `task.json` with `phase: planning`.
  5. Commit the pointer file on the `agentic-coding` branch and push it to origin.
  Do not manually create the pointer, worktree, branch, or task files.

### Step 2: Planning & Research
- Confirm the worktree and task folder were created successfully by the script:
    `ls worktrees/{YYYYMMDD}_{slug}/docs/agent-tasks/{YYYYMMDD}_{slug}`
- The task folder should already contain `task.json` and `memory/`.
- You MUST populate the `owner` field in `task.json` with the name of the Human overseeing the task. Prefer the value from `.agentic-coding/config/personal-config.json` when available.
- Commit inside the worktree: `{slug}: begin planning`
- Invoke a sub-agent and assign it the `.agentic-coding/skills/performing-discovery/SKILL.md` workflow. Pass it the absolute worktree path and the task folder path inside it. Direct it to save all findings to `memory/{topic}_research.md` within the task folder.
- Run additional research passes if needed; log progress in PROGRESS.md.
- At the end of the planning and research phase, verify that memory/ contains enough context for the SDET and Developer agents to work without re-doing research.

### Step 3: Planning & Human Approval
- Adopt the `.agentic-coding/skills/planning-tasks/SKILL.md` workflow. You must collaborate closely with the Human to draft the `task.json` using the schema defined in `.agentic-coding/skills/task-workspace/SKILL.md`.
- Ensure the Human approves the finalized plan.
- Log the approval (including timestamp and any conditions) in PROGRESS.md.
- Commit inside the worktree: `{slug}: plan approved`

### Step 4: Test Authoring
- Update `task.json` to set `phase: test-authoring`.
- Commit inside the worktree: `{slug}: begin test authoring`
- Invoke a sub-agent and assign it the `.agentic-coding/skills/authoring-tests/SKILL.md` workflow to write tests. Pass it:
    - The absolute worktree path.
    - The task folder path inside the worktree.
  Direct it to read all files in memory/ before beginning.
- Present the authored tests to the Human for approval. The Human should confirm:
    - Tests cover all scenarios listed in task.json > tests.
    - Tests are written to fail before implementation (red phase).
    - Naming and structure match project conventions.
- Do not proceed to development until the Human explicitly approves.
- Log approval in PROGRESS.md.
- Commit inside the worktree: `{slug}: tests approved`

### Step 5: Development & Iteration
- Update `task.json` to set `phase: development`.
- Commit inside the worktree: `{slug}: development started`
- Invoke a sub-agent and assign it the `.agentic-coding/skills/executing-plans/SKILL.md` workflow to implement the plan. Pass it:
    - The absolute worktree path.
    - The task folder path inside the worktree.
  Direct it to read task.json and all files in memory/ before beginning.
- When development is complete and the sub-agent returns, ensure that all changes have been committed to the feature branch.
- Invoke a review sub-agent with `.agentic-coding/skills/reviewing-code/SKILL.md` to audit the implementation and catch any issues.
- If the audit identifies changes needed, commit the review feedback and then continue development.
- Continue this development-review loop until the review agent approves the implementation.
- Log all review outcomes and iterations in PROGRESS.md with timestamps.

### Step 6: Human Verification & Completion
- Update `task.json` to set `phase: verification`.
- Commit inside the worktree: `{slug}: ready for verification`
- Notify the Human that the task is ready for manual verification and await their sign-off. Do not attempt to run automated checks or merge the code yourself.
- Once the Human verifies the feature and performs the merge or PR:
  - Remove the worktree: `git worktree remove worktrees/{YYYYMMDD}_{slug}`
  - Update the pointer file on the agentic-coding branch (`.agentic-coding/tasks/{YYYYMMDD}_{slug}.json`) to add the `completed` field with today's date.
  - Commit on the agentic-coding branch: `task: complete {slug}`

## 9. Handling Blockers
If any phase reveals the task cannot proceed:
1. Create BLOCKER.md using the schema in `.agentic-coding/task-workspace/SKILL.md`.
2. Update PROGRESS.md with a note referencing the blocker.
3. Preserve the current `phase` so it reflects where the block occurred.
4. Commit inside the worktree: `{slug}: blocked — {one-line reason}`
5. Immediately escalate to the Human with a concise summary and the specific questions from BLOCKER.md.
6. Once the Human resolves the blocker, delete BLOCKER.md, update PROGRESS.md with the resolution, and commit: `{slug}: blocker resolved — {one-line resolution}`

Prefer catching blockers early: the pre-flight check in Step 1 and the end-of-planning memory review in Step 2 are your primary opportunities to surface issues before they stall execution.

## 10. Available Scripts
Scripts live in `.agentic-coding/scripts/`.

### new-task.js
Creates a new pointer file in `.agentic-coding/tasks/`. Usage:
```bash
node .agentic-coding/scripts/new-task.js "<Task Name>" <priority> "<branch-name>"
```

### task-status.js
Reads all pointer files and fetches task.json from each branch to display a status overview. Usage:
```bash
node .agentic-coding/scripts/task-status.js
```

### validate-task.js
Validates and formats a task document, and formats the pointer file when present. Usage:
```bash
node .agentic-coding/scripts/validate-task.js {taskId}
```
