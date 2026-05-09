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
├── task.json       # Structured task metadata, plan, tests, and completion criteria
├── PROGRESS.md     # Append-only progress log
├── BLOCKER.md      # Created when task is blocked (optional)
└── memory/         # Research findings, test notes, developer notes
```

Lightweight pointer files on the `agentic-coding` branch reference each task:

```
.agentic-coding/tasks/{YYYYMMDD}_{slug}.json
```

## Pointer File Schema

```json
{
  "branch": "feature/add-user-auth",
  "priority": 7,
  "created": "2026-05-02",
  "completed": "2026-05-10"
}
```

The `completed` field is only present on done tasks and stores the completion date. The `task-status.js` script uses this to skip done tasks when fetching live status. Tasks are sorted by `priority` (highest first).

## Task Contents

### task.json

Every task folder must contain a `task.json` file. This file contains structured information about the task and is the single source of truth for planning, implementation, tests, and completion criteria.

**Schema:**
```json
{
  "name": "Task Name",
  "description": "A description of the task and its objectives.",
  "branch": "feature/branch-name",
  "phase": "planning",
  "owner": "",
  "dependencies": [],
  "implementation": [ // list of specific implementation steps grouped by file
    {
      "file": "path/to/implementation/file",
      "changes": [
        {
          "target": "doSomething", // the specific function, module, API, or file area being changed
          "description": "What this change should accomplish or the behavior it should enable.",
          "implemented": false, // set to true once the change is implemented
          "reviewStatus": "none|approved|rejected", // updated by the Reviewer after code review
          "reviewFeedback": [] // if reviewStatus is rejected, an array of specific feedback items (e.g. "Line 45: potential SQL injection vulnerability. Use parameterized queries.")
        }
      ],
    }
  ],
  "tests": [
    {
      "written": false,
      "file": "path/to/test/file",
      "targets": ["doSomething"], // the specific functions, modules, routes, files or features this test is targeting
      "description": "A brief description of what this test verifies.",
    }
  ]
}
```

**Valid phases:** `planning`, `test-authoring`, `development`, `verification`, `done`

Notes:
- Blocked is not a phase. A task is blocked when `BLOCKER.md` exists in the task folder.
- Preserve the current `phase` when a blocker is raised so the phase reflects where the block occurred.

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

Each task gets a dedicated Git worktree, enabling parallel execution across tasks. Worktrees live in the `worktrees/` directory at the project root (outside `.agentic-coding/`).

### Naming Convention

Worktree folder names use a date prefix and slug:

  `worktrees/{YYYYMMDD}_{slug}/`
  e.g. `worktrees/20260502_add-user-auth/`

The branch name (stored in task.json) may differ from the slug and may contain characters unsuitable for paths (e.g. `feature/sign-in-with-apple`). Always derive the worktree path from the slug, never the branch name.

### Lifecycle

| Phase | Worktree State |
| :--- | :--- |
| `backlog` | No worktree exists. Only a pointer file exists on the agentic-coding branch. |
| `discovery` | Manager creates worktree from root branch, then immediately checks out the feature branch. Task folder is created on the feature branch. |
| `planned` to `verification` | Agents perform all work inside the worktree path on the feature branch. |
| `done` | Branch is merged (or PR'd), worktree is removed by Manager. |
| `blocked` | Worktree is preserved until the block is resolved. |

### Agent Responsibilities

The Manager (running the `managing-tasks` skill) is the only agent that creates or removes worktrees. All other sub-agents receive the worktree path from the Manager and work exclusively inside it. No sub-agent should run `git worktree add` or `git worktree remove`.

## Available Scripts

Scripts live in `.agentic-coding/scripts/`.

### new-task.js

Creates a new pointer file in `.agentic-coding/tasks/`, a new worktree under `worktrees/`, and a feature branch inside that worktree. It also creates the task folder at `docs/agent-tasks/{slug}/`, writes an initial `task.json`, commits the pointer file to the `agentic-coding` branch, and pushes it.

Usage:

```bash
node .agentic-coding/scripts/new-task.js "<Task Name>" <priority> "<branch-name>"
```

### task-status.js

Reads all pointer files and fetches task.json from each active branch to display a status overview. Skips tasks that have a `completed` field in their pointer file. Usage:

```bash
node .agentic-coding/scripts/task-status.js
```

### validate-task.js

Validates and formats a task document, and formats the pointer file when present. Usage:

```bash
node .agentic-coding/scripts/validate-task.js {taskId}
```
