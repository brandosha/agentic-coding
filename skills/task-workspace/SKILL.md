---
name: task-workspace
description: "Reference document defining the task workspace structure, file schemas, worktree conventions, and available scripts. All agents should read this."
---

# Task Workspace Structure & Schemas

This document defines the task workspace structure and file schemas used throughout the task lifecycle. It is the authoritative reference for the Manager and all sub-agents.

## Task Storage

Task documents live inside the feature branch worktree at:

```
docs/agent-tasks/{YYYYMMDD}_{slug}/
├── task.yaml       # Structured task metadata and phase tracking
├── README.md       # Goal, Approach, Tests, Completion Criteria
├── PROGRESS.md     # Append-only progress log
├── BLOCKER.md      # Created when task is blocked (optional)
└── memory/         # Research findings, test notes, developer notes
```

Lightweight pointer files on the `agents` branch reference each task:

```
.agents/tasks/{YYYYMMDD}_{slug}.yaml
```

## Pointer File Schema

```yaml
branch: "feature/add-user-auth"
priority: 7                     # scale from 1 (lowest) to 10 (critical)
created: "2026-05-02"
completed: "2026-05-10"          # Added when the task is done
```

The `completed` field is only present on finished tasks. The `task-status.js` script uses this to skip completed tasks when fetching live status. Tasks are sorted by `priority` (highest first).

## Task Contents

### task.yaml

Every task folder must contain a `task.yaml` file. This file contains structured information about the task.

**Schema:**
```yaml
name: "Task Name"
description: "A brief description of the task and its objectives."
branch: "feature/branch-name"
phase: "discovery"    # Current lifecycle phase
owner: ""             # the human who is overseeing a specific task
dependencies: []      # list of task slugs that must be completed first

files:                # list of files that the agent will modify or create
  - path: "path/to/file"
    change_summary: "Brief description of the intended changes to this file"
```

**Valid phases:** `backlog`, `discovery`, `planned`, `test-authoring`, `development`, `review`, `verification`, `done`, `blocked`

### README.md

A markdown file that describes the "what" and "how" of the task. It should include the following sections:

```markdown
# Task Name

A brief description of the task

## Goal

The high level objective of the task

## Approach

A step-by-step implementation plan for how the agent will accomplish the task. This should be detailed enough to guide the agent through execution.

## Tests

A list of specific tests that should be implemented to verify the correctness of the task. This can include unit tests, integration tests, or any other relevant testing strategies.

## Completion Criteria

A checklist of specific conditions that must be met for the task to be considered complete.
```

### PROGRESS.md

An append-only markdown file that tracks the ongoing progress of the task. It should be updated regularly by the agent as it works through the task.

```markdown
# Progress Log

## [Date and time] - [Agent Name]

Progress update describing what has been accomplished, any challenges encountered, and next steps.
```

### BLOCKER.md

This file must be created immediately when a task becomes blocked. It should contain a detailed description of the issue that is blocking progress, along with any relevant context.

```markdown
# Blocker Report

## Description

A detailed description of the issue that is blocking progress on the task including context, error messages, and any relevant information.

## Questions

A list of specific, actionable questions that a human can answer to help unblock the task.
```

When a task is blocked, the agent should also update the `PROGRESS.md` file with a note about the blocker.

### `memory/` directory

Each task folder should also contain a `memory/` directory where agents can store research findings, code snippets, test scaffolding notes, and other intermediate outputs. As the task is passed between agents in different phases, this memory provides context and continuity.

## Worktrees

Each task gets a dedicated Git worktree, enabling parallel execution across tasks. Worktrees live in the `worktrees/` directory at the project root (outside `.agents/`).

### Naming Convention

Worktree folder names use a date prefix and slug:

  `worktrees/{YYYYMMDD}_{slug}/`
  e.g. `worktrees/20260502_add-user-auth/`

The branch name (stored in task.yaml) may differ from the slug and may contain characters unsuitable for paths (e.g. `feature/sign-in-with-apple`). Always derive the worktree path from the slug, never the branch name.

### Lifecycle

| Phase | Worktree State |
| :--- | :--- |
| `backlog` | No worktree exists. Only a pointer file exists on the agents branch. |
| `discovery` | Manager creates worktree from root branch, then immediately checks out the feature branch. Task folder is created on the feature branch. |
| `planned` to `verification` | Agents perform all work inside the worktree path on the feature branch. |
| `done` | Branch is merged (or PR'd), worktree is removed by Manager. |
| `blocked` | Worktree is preserved until the block is resolved. |

### Agent Responsibilities

The Manager (running the `managing-task-lifecycle` skill) is the only agent that creates or removes worktrees. All other sub-agents receive the worktree path from the Manager and work exclusively inside it. No sub-agent should run `git worktree add` or `git worktree remove`.

## Available Scripts

Scripts live in `.agents/skills/managing-task-lifecycle/scripts/`.

### new-task.js

Creates a new pointer file in `.agents/tasks/`. Usage:

```bash
node .agents/skills/managing-task-lifecycle/scripts/new-task.js "<Task Name>" <priority> "<branch-name>"
```

### task-status.js

Reads all pointer files and fetches task.yaml from each active branch to display a status overview. Skips tasks that have a `completed` field in their pointer file. Usage:

```bash
node .agents/skills/managing-task-lifecycle/scripts/task-status.js
```
