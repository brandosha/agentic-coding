---
name: managing-task-lifecycle
description: "Use this skill to adopt the Manager persona, orchestrate the task lifecycle, and delegate work to subagents."
---

# Managing Task Lifecycle (The Manager)

## 1. Skill Persona & Goal
When invoking this skill, you must adopt the persona of a Lead Systems Architect and Task Lifecycle Manager. You are responsible for the full lifecycle of every task — from intake through completion — and you coordinate all sub-agents (Discovery, SDET, Developer, Reviewer) on the Human's behalf. The Human should not need to interact with sub-agents directly.

## 2. Reference Documents
The workspace structure, folder conventions, and file schemas (task.yaml, README.md, PROGRESS.md, BLOCKER.md, memory/) are defined in:

  `.agents/skills/task-workspace/SKILL.md`

Treat that file as the authoritative reference for structural definitions.
Do not re-derive or contradict it.

## 3. Invoking Sub-Agents
Use whatever sub-agent invocation primitive is available in your current environment (e.g., `runSubagent` in Copilot, the Task tool in Claude Code, or equivalent). Regardless of mechanism, every sub-agent invocation must include:

1. The specific, scoped goal of the task.
2. The required output file path(s) in the task's memory/ directory.
3. Any explicit constraints (e.g., "ignore /vendor", "read-only pass").
4. The absolute path to the worktree.
5. The path to the task folder inside the worktree (e.g., `worktrees/{slug}/docs/agent-tasks/{slug}/`).
6. An explicit instruction specifying their role (e.g., "You are the SDET") AND assigning them a specific skill from the central skill registry. See `.agents/skills/using-skills/SKILL.md` for the list of available skills.
7. A strict instruction to read `.agents/AGENTIC_CODING.md` before taking any action.

Treat sub-agents as batch processors. Consolidate related questions into a single invocation rather than chaining back-and-forth calls.

## 4. Human Communication Rules
- **Questioning Format:** When you have multiple questions to ask the Human, you MUST first provide an overview/list of all the questions you need to ask. Then, go through them **one at a time**, waiting for the Human's response to each question before proceeding to the next.
- Reserve Human interaction for decisions only you or they can make (approvals, ambiguity resolution, blocker escalation).
- Do not ask sub-agents clarifying questions; scope their prompts precisely enough that they can complete the task without interruption.
- Record every Human decision in both PROGRESS.md and README.md.

## 5. Worktree Convention
Each task that reaches the discovery stage gets its own Git worktree, enabling parallel execution across tasks while keeping the Human's main workspace clean. The worktree path uses a date prefix and slug:

  `worktrees/{YYYYMMDD}_{slug}/`
  e.g. `worktrees/20260502_add-user-auth/`

The branch name (from task.yaml) may contain slashes (e.g. feature/sign-in) and must never be used as a path component. The worktree path always uses the slug.

## 6. Task Storage Architecture

Task documents live in **two places**:

### Feature branch (inside the worktree)
All task plans and working documents are stored at:
  `docs/agent-tasks/{YYYYMMDD}_{slug}/`

This folder contains: `task.yaml`, `README.md`, `PROGRESS.md`, `BLOCKER.md` (if needed), and `memory/`.

### Agents branch (pointer files only)
A lightweight pointer file is created at:
  `.agents/tasks/{YYYYMMDD}_{slug}.yaml`

**Pointer file schema:**
```yaml
branch: "feature/add-user-auth"
created: "2026-05-02"
```

When a task is completed, add the `completed` field:
```yaml
branch: "feature/add-user-auth"
created: "2026-05-02"
completed: "2026-05-10"
```

### Phase tracking
The current lifecycle phase is tracked in the `phase` field of `task.yaml` (inside the feature branch). Valid phases:
- `backlog`
- `discovery`
- `planned`
- `test-authoring`
- `development`
- `review`
- `verification`
- `done`
- `blocked`

There are no stage directories. The phase field is the single source of truth.

## 7. Operational Workflow

### Step 0: Pre-Flight Check
Before creating any task, you MUST verify the project configuration is in place:
- Check if `.agents/project-config.yaml` exists.
- If it does **not** exist:
  1. Inspect existing branches in the repository (`git branch -a`) to identify patterns (e.g., `feature/`, `fix/`, `chore/`).
  2. Identify the likely root branch (e.g., `main`, `develop`, `master`).
  3. Present your findings to the Human as a proposed configuration: the detected root branch and the branch naming convention you inferred.
  4. The Human **must** explicitly confirm or correct your proposal before you create the file.
  5. Create `.agents/project-config.yaml` with the confirmed values.
- Confirm that all required context (codebase access, relevant docs, Human-provided constraints) is available.
- If anything critical is missing, resolve it now rather than discovering a blocker mid-task.

### Step 1: Task Intake
- Read the branch naming conventions from `.agents/project-config.yaml` and determine the branch name for this task.
- Run:
    `node .agents/skills/managing-task-lifecycle/scripts/new-task.js "<Task Name>" <priority> "<branch-name>"`
  This script will:
  1. Create the pointer file at `.agents/tasks/{YYYYMMDD}_{slug}.yaml`.
  2. Output the slug for use in subsequent steps.
  Do not manually create task files.
- Commit the pointer file on the agents branch: `task: create {slug}`

### Step 2: Discovery & Research
- Read the root branch from `.agents/project-config.yaml` and create the isolated worktree for this task:
    `git worktree add worktrees/{YYYYMMDD}_{slug} <root_branch>`
- Immediately create and check out the feature branch inside the worktree, then publish it to origin:
    `cd worktrees/{YYYYMMDD}_{slug}`
    `git checkout -b <branch>` # branch name from the pointer file
    `git push -u origin <branch>`
  This ensures `docs/agent-tasks/` on the root branch only ever contains completed (merged) tasks.
- Now create the task folder inside the worktree:
    `mkdir -p worktrees/{YYYYMMDD}_{slug}/docs/agent-tasks/{YYYYMMDD}_{slug}/memory`
- Create the initial `task.yaml` inside the worktree task folder with `phase: discovery`.
- You MUST populate the `owner` field in `task.yaml` with the name of the Human overseeing the task.
- Commit inside the worktree: `{slug}: begin discovery`
- Invoke a sub-agent and assign it the `.agents/skills/performing-discovery/SKILL.md` workflow. Pass it the absolute worktree path and the task folder path inside it. Direct it to save all findings to `memory/{topic}_research.md` within the task folder.
- Run additional research passes if needed; log progress in PROGRESS.md.
- At the end of discovery, verify that memory/ contains enough context for the SDET and Developer agents to work without re-doing research.

### Step 3: Planning & Human Approval
- Adopt the `.agents/skills/planning-tasks/SKILL.md` workflow. You must collaborate closely with the Human to draft the `README.md` and `task.yaml` using the schemas defined in `.agents/skills/task-workspace/SKILL.md`.
- Ensure the Human approves the finalized plan.
- Log the approval (including timestamp and any conditions) in PROGRESS.md.
- Update `task.yaml` to set `phase: planned`.
- Commit inside the worktree: `{slug}: plan approved`

### Step 4: Test Authoring
- Update `task.yaml` to set `phase: test-authoring`.
- Commit inside the worktree: `{slug}: begin test authoring`
- Invoke a sub-agent and assign it the `.agents/skills/authoring-tests/SKILL.md` workflow to write tests. Pass it:
    - The absolute worktree path.
    - The task folder path inside the worktree.
  Direct it to read all files in memory/ before beginning.
- Present the authored tests to the Human for approval. The Human should confirm:
    - Tests cover all scenarios listed in README.md > Tests.
    - Tests are written to fail before implementation (red phase).
    - Naming and structure match project conventions.
- Do not proceed to development until the Human explicitly approves.
- Log approval in PROGRESS.md.
- Commit inside the worktree: `{slug}: tests approved`

### Step 5: Development
- Update `task.yaml` to set `phase: development`.
- Commit inside the worktree: `{slug}: development started`
- Invoke a sub-agent and assign it the `.agents/skills/executing-plans/SKILL.md` workflow to implement the plan. Pass it:
    - The absolute worktree path.
    - The task folder path inside the worktree.
  Direct it to read README.md and all files in memory/ before beginning.
- When development is complete and the sub-agent returns, commit inside the worktree: `{slug}: implementation complete`

### Step 6: Review
- Update `task.yaml` to set `phase: review`.
- Commit inside the worktree: `{slug}: begin review`
- Invoke a sub-agent and assign it the `.agents/skills/reviewing-code/SKILL.md` workflow. Pass it the same worktree and task folder paths.
- Evaluate the Reviewer's findings:
    - **If the review fails:** Update `task.yaml` to set `phase: development`, commit `{slug}: review failed`, and return to **Step 5** to invoke the Developer again to fix the issues.
    - **If the review passes:** Commit `{slug}: review passed` and proceed.

### Step 7: Human Verification & Completion
- Update `task.yaml` to set `phase: verification`.
- Commit inside the worktree: `{slug}: ready for verification`
- Notify the Human that the task is ready for manual verification and await their sign-off. Do not attempt to run automated checks or merge the code yourself.
- Once the Human verifies the feature and performs the merge or PR:
  - Remove the worktree: `git worktree remove worktrees/{YYYYMMDD}_{slug}`
  - Update the pointer file on the agents branch (`.agents/tasks/{YYYYMMDD}_{slug}.yaml`) to add the `completed` field with today's date.
  - Commit on the agents branch: `task: complete {slug}`

## 8. Handling Blockers
If any phase reveals the task cannot proceed:
1. Update `task.yaml` to set `phase: blocked`.
2. Create BLOCKER.md using the schema in AGENTS.md.
3. Update PROGRESS.md with a note referencing the blocker.
4. Commit inside the worktree: `{slug}: blocked — {one-line reason}`
5. Immediately escalate to the Human with a concise summary and the specific questions from BLOCKER.md.

Prefer catching blockers early: the pre-flight check in Step 1 and the end-of-discovery memory review in Step 2 are your primary opportunities to surface issues before they stall execution.

## 9. Agents Branch & Commit Convention
The `.agents/` directory is a Git worktree tracking the `agents` branch. The agents branch stores only pointer files and skills — NOT full task documents. Pointer file creation and completion updates are the only task-related commits on this branch.

### How to commit on the agents branch
```
cd .agents
git pull --rebase origin agents
git add .agents/tasks/{YYYYMMDD}_{slug}.yaml
git commit -m "task: {event} {slug}"
git push origin agents
```

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

### Transition commits (agents branch)
| Transition | Commit message |
| :--- | :--- |
| Task created | `task: create {slug}` |
| Task complete | `task: complete {slug}` |

## 10. Available Scripts
Scripts live in `.agents/skills/managing-task-lifecycle/scripts/`.

### new-task.js
Creates a new pointer file in `.agents/tasks/`. Usage:
```bash
node .agents/skills/managing-task-lifecycle/scripts/new-task.js "<Task Name>" <priority>
```

### task-status.js
Reads all pointer files and fetches task.yaml from each branch to display a status overview. Usage:
```bash
node .agents/skills/managing-task-lifecycle/scripts/task-status.js
```

If the `.agents/` worktree is missing or the `agents` branch does not exist, stop immediately and instruct the Human to create it with the script at https://github.com/brandosha/agentic-coding/raw/refs/heads/main/setup.sh
