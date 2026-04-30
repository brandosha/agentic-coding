# Agentic Coding Guidelines

This file defines conventions and expectations that apply to every agent
operating in this codebase, regardless of role or lifecycle stage. Read this
file before acting on any task.

For workspace structure, file schemas, and the task lifecycle, see:
  .agents/tasks/AGENTS.md

For role-specific instructions, see the agent prompt for your current role in `.agents/roles/`.
**CRITICAL:** Always read your role instructions first. Unless otherwise instructed, you should default to the Architect role (`.agents/roles/architect.md`).

---

## 1. General Conduct

- **You work for the Human via the Architect.** Sub-agents (Discovery, SDET,
  Developer, Reviewer) report to the Architect, not directly to the Human.
  Do not surface decisions, questions, or blockers to the Human unless your
  role prompt explicitly instructs you to.

- **Do not exceed your scope.** Each agent has a defined domain. If you
  discover something outside your scope that requires attention, document it
  in PROGRESS.md or memory/ and report it to the Architect. Do not act on it
  unilaterally.

- **Prefer doing less and reporting over doing more and guessing.** If the
  task definition is ambiguous, incomplete, or contradicts what you find in
  the codebase, stop and report rather than filling in the gaps yourself.

- **Every action must be traceable.** Log meaningful progress updates to
  PROGRESS.md as you work. If another agent picks up after you, they should
  be able to reconstruct your reasoning from PROGRESS.md and memory/ alone.

- **Never silently skip a step.** If you cannot complete a step, create a
  BLOCKER.md and report to the Architect. Do not move on and hope it resolves
  itself.

---

## 2. Reading the Task Workspace

All task context lives in the task folder under `.agents/tasks/{stage}/
{id}_{slug}/`. When you are invoked, you will be given the path to the current
task folder. Always read the following files before doing any work:

| File | What to look for |
| :--- | :--- |
| `task.yaml` | Scope: which files and entities you are authorized to touch |
| `README.md` | Goal, Approach, Tests, and Completion Criteria |
| `PROGRESS.md` | What previous agents did, any trade-offs or difficulties |
| `memory/` | Research findings, test scaffolding notes, developer notes |

Do not rely on memory from previous conversations or sessions. The task folder
is your only source of truth. If a file is missing that you expect to exist,
report it as a blocker rather than proceeding without it.

### Worktrees

From stage 3-test-authoring onward, all file changes must be made inside the
worktree path provided by the Architect:

  worktrees/{id}_{slug}/

Do not modify files in the main repository checkout. Do not create or remove
worktrees — that is the Architect's responsibility. See `.agents/tasks/AGENTS.md`
for the full worktree lifecycle.

### The Agents Branch

The `.agents/` directory is a Git worktree tracking the `agents` branch. It
is the authoritative, version-controlled record of all task activity. Do not
modify `.agents/` contents from the main branch checkout or from inside a
task worktree. The Architect is the only agent that commits to the `agents`
branch.

---

## 3. General Code Guidance

These principles apply to all code written or modified in this project,
regardless of language or framework.

### Surgical changes
Make the minimum change required to satisfy the task. Do not refactor,
rename, or reorganize code outside the scope defined in `task.yaml`. If you
notice something worth fixing that is out of scope, document it in
`memory/technical_debt_observations.md` for a future task.

### Consistency over correctness
If the existing codebase uses a pattern you would not choose yourself, match
it anyway. Consistency is more valuable than local optimization. The only
exception is a clear security vulnerability — document and report those
immediately regardless of scope.

### Explicitness over cleverness
- Prefer clear, readable code over terse or clever solutions.
- Avoid unnecessary abstractions. Add a layer only when duplication is already
  present and the abstraction genuinely simplifies things.
- Name variables, functions, and files to describe what they do, not how they
  do it.
- Inline comments should explain *why*, not *what*. If the what requires
  explanation, the code should be simplified first.

### Leave no trace
When you finish your work:
- Remove all debug logs, temporary comments, and dead code.
- Ensure no secrets, credentials, or environment-specific values are hardcoded.
- Verify no new compiler warnings or linter errors were introduced.

### Commit hygiene
- Commit incrementally — each commit should represent one coherent unit of
  work (e.g. one passing test, one implemented function).
- Write commit messages in the imperative mood, describing what the commit
  does: `Add validation for empty input` not `Added validation` or `fix stuff`.
- Never commit directly to the main branch. All work happens on the branch
  specified in `task.yaml`, inside the task's worktree.
