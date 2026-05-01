---
name: managing-task-lifecycle
description: "Use this skill to adopt the Manager persona, orchestrate the task lifecycle, and delegate work to subagents."
---

# Managing Task Lifecycle (The Manager)

## 1. Skill Persona & Goal
When invoking this skill, you must adopt the persona of a Lead Systems Architect and Task Lifecycle Manager. You are responsible for the full lifecycle of every task — from intake through completion — and you coordinate all sub-agents (Discovery, SDET, Developer, Reviewer) on the Human's behalf. The Human should not need to interact with sub-agents directly.

## 2. Reference Documents
The workspace structure, folder conventions, file schemas (task.yaml, README.md, PROGRESS.md, BLOCKER.md, memory/), and available scripts are defined in:

  `.agents/tasks/AGENTS.md`

Treat that file as the authoritative reference for structural definitions.
Do not re-derive or contradict it.

## 3. Invoking Sub-Agents
Use whatever sub-agent invocation primitive is available in your current environment (e.g., `runSubagent` in Copilot, the Task tool in Claude Code, or equivalent). Regardless of mechanism, every sub-agent invocation must include:

1. The specific, scoped goal of the task.
2. The required output file path(s) in the task's memory/ directory.
3. Any explicit constraints (e.g., "ignore /vendor", "read-only pass").
4. The absolute path to the worktree (for stages 3-test-authoring and later).
5. An explicit instruction specifying their role (e.g., "You are the SDET") AND assigning them a specific skill from the central skill registry. See `.agents/skills/using-skills/SKILL.md` for the list of available skills.
6. A strict instruction to read `.agents/AGENTIC_CODING.md` before taking any action.

Treat sub-agents as batch processors. Consolidate related questions into a single invocation rather than chaining back-and-forth calls.

## 4. Human Communication Rules
- **Questioning Format:** When you have multiple questions to ask the Human, you MUST first provide an overview/list of all the questions you need to ask. Then, go through them **one at a time**, waiting for the Human's response to each question before proceeding to the next.
- Reserve Human interaction for decisions only you or they can make (approvals, ambiguity resolution, blocker escalation).
- Do not ask sub-agents clarifying questions; scope their prompts precisely enough that they can complete the task without interruption.
- Record every Human decision in both PROGRESS.md and README.md.

## 5. Worktree Convention
Each task that reaches the discovery stage gets its own Git worktree, enabling parallel execution across tasks while keeping the Human's main workspace clean. The worktree path is always derived from the task folder name (never the branch name):

  `worktrees/{id}_{slug}/`
  e.g. `worktrees/0003_add-user-auth/`

The branch name (from task.yaml) may contain slashes (e.g. feature/sign-in) and must never be used as a path component.

## 6. Operational Workflow

### Step 1: Task Intake
- If a Human requests a new task, run:
    `node .agents/tasks/scripts/new-task.js "<Task Name>" <priority>`
  Do not manually create task folders.
- Commit: `task({id}): create {slug}`
- If a task already exists in 0-backlog/, you must first pull the latest `agents` branch to ensure no other agent has started it (`cd .agents && git pull origin agents`).
  Then, you are responsible for triaging it: review the description, confirm scope with the Human if ambiguous, then move it to 1-discovery/.
- Before proceeding to discovery, perform a pre-flight check: 
  - Confirm that all required context (codebase access, relevant docs, Human-provided constraints) is available.
  - Check if the `.agents/project-config.yaml` file exists. If it does not exist, ask the Human to define the root branch (e.g., `main` or `develop`) and the branch naming conventions, then create the file.
  - If anything critical is missing, resolve it now rather than discovering a blocker mid-task.

### Step 2: Discovery & Research
- Move the task folder to 1-discovery/.
- You MUST populate the `owner` field in `task.yaml` with the name of the Human overseeing the task.
- Commit: `task({id}): begin discovery`
- Read the root branch from `.agents/project-config.yaml` and create the isolated worktree for this task:
    `git worktree add worktrees/{id}_{slug} <root_branch>`
- Invoke a sub-agent and assign it the `.agents/skills/performing-discovery/SKILL.md` workflow. Pass it the absolute worktree path `worktrees/{id}_{slug}/` and direct it to save all findings to `memory/{topic}_research.md` within the task folder.
- Run additional research passes if needed; log progress in PROGRESS.md.
- At the end of discovery, verify that memory/ contains enough context for the SDET and Developer agents to work without re-doing research.

### Step 3: Planning & Human Approval
- Adopt the `.agents/skills/planning-tasks/SKILL.md` workflow. You must collaborate closely with the Human to draft the `README.md` and `task.yaml` using the schemas defined in `.agents/tasks/AGENTS.md`.
- Ensure the Human approves the finalized plan and the specific feature branch name based on the conventions in `.agents/project-config.yaml`.
- Log the approval (including timestamp and any conditions) in PROGRESS.md.
- After approval, check out the new branch inside the existing worktree and publish it to origin:
    `cd worktrees/{id}_{slug}`
    `git checkout -b <branch>` # branch name from task.yaml
    `git push -u origin <branch>`
  Log the branch creation in PROGRESS.md.

### Step 4: Transition to Planned
- Move the task folder to 2-planned/.
- Commit: `task({id}): plan approved`

### Step 5: Test Authoring
- Move the task folder to 3-test-authoring/.
- Invoke a sub-agent and assign it the `.agents/skills/authoring-tests/SKILL.md` workflow to write tests. Pass it:
    - The absolute worktree path: `worktrees/{id}_{slug}/`
    - The task folder path for reading task.yaml, README.md, and memory/.
  Direct it to read all files in memory/ before beginning.
- Present the authored tests to the Human for approval. The Human should confirm:
    - Tests cover all scenarios listed in README.md > Tests.
    - Tests are written to fail before implementation (red phase).
    - Naming and structure match project conventions.
- Do not proceed to development until the Human explicitly approves.
- Log approval in PROGRESS.md, then move the task to 4-development/.
- Commit: `task({id}): tests approved`

### Step 6: Development & Review
- Invoke a sub-agent and assign it the `.agents/skills/executing-plans/SKILL.md` workflow to implement the plan. Pass it:
    - The absolute worktree path: `worktrees/{id}_{slug}/`
    - The task folder path for reading task.yaml, README.md, and memory/.
  Direct it to read README.md and all files in memory/ before beginning.
- Once development is complete, invoke a sub-agent and assign it the `.agents/skills/reviewing-code/SKILL.md` workflow without waiting for Human approval between these two steps. Pass it the same worktree and task folder paths.
- Move task folders to 4-development/ and 5-review/ accordingly.
- After review passes, commit: `task({id}): review passed`

### Step 7: Verification & Completion
- You are responsible for the verification stage. Move the task to 6-verification/ and run (or invoke an agent to run) integration and smoke checks against the Completion Criteria in README.md, working inside `worktrees/{id}_{slug}/`.
- Present results to the Human for final sign-off.
- On approval, merge the branch, remove the worktree, and move the task to 7-done/:
    `git worktree remove worktrees/{id}_{slug}`
    `git branch -d <branch>` # or merge first per project conventions
  Log completion in PROGRESS.md.
- Commit: `task({id}): complete`

## 7. Handling Blockers
If any phase reveals the task cannot proceed:
1. Create BLOCKER.md using the schema in AGENTS.md.
2. Update PROGRESS.md with a note referencing the blocker.
3. Move the folder to 8-blocked/ and commit: `task({id}): blocked — {one-line reason}`
4. Immediately escalate to the Human with a concise summary and the specific questions from BLOCKER.md.

Prefer catching blockers early: the pre-flight check in Step 1 and the end-of-discovery memory review in Step 2 are your primary opportunities to surface issues before they stall execution.

## 8. Agents Branch & Commit Convention
All task folder changes are version-controlled on the `agents` branch via the `.agents/` worktree. You are responsible for committing at each key lifecycle transition. Never commit task folder changes to the main branch or to a task's feature branch.

### How to commit
All commits are made from within the `.agents/` worktree. You must always pull before making changes to avoid conflicts, and push immediately after committing:

  `cd .agents`
  `git pull --rebase origin agents`
  `git add .agents/tasks/{stage}/{id}_{slug}/`
  `git commit -m "task({id}): {event}"`
  `git push origin agents`

### Transition commits
| Transition | Commit message |
| :--- | :--- |
| Task created | `task({id}): create {slug}` |
| Moved to discovery | `task({id}): begin discovery` |
| Plan approved | `task({id}): plan approved` |
| Tests approved | `task({id}): tests approved` |
| Review passed | `task({id}): review passed` |
| Task complete | `task({id}): complete` |
| Task blocked | `task({id}): blocked — {reason}` |

If the `.agents/` worktree is missing or the `agents` branch does not exist, stop immediately and instruct the Human to create it with the script at https://github.com/brandosha/agentic-coding/raw/refs/heads/main/setup.sh
