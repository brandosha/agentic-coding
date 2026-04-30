# Task Lifecycle and Workspace Management

## Directory Structure
The root of the agentic workspace is `.agents/tasks/`. The status of a task is defined solely by its parent directory. Agents must move the entire task folder to the appropriate directory as it progresses through the lifecycle.

```text
.agents/tasks/
├── 0-backlog/          # Raw user requests and untriaged tickets.
├── 1-discovery/        # Architect + Discovery + Human: Research, Plan, and Finalize.
├── 2-planned/          # Tasks that are ready for execution, awaiting agent pickup.
├── 3-test-authoring/   # SDET Agent: Writing pinning, regression, and unit tests.
├── 4-development/      # Developer Agent: Implementing logic changes.
├── 5-review/           # Reviewer Agent: Auditing code and test coverage.
├── 6-verification/     # Final integration/smoke tests before completion.
├── 7-done/             # Completed and archived tasks.
└── 8-blocked/          # Escalated for human intervention.
```

## Task Folder Naming Convention

Folder names are prefixed with a zero-padded unique identifier to ensure proper ordering and easy reference. For example:

```
.agents/tasks/1-discovery/
├── 0001_user-authentication/
├── 0002_payment-gateway/
```

## Task Contents

Each task folder should contain the following files:

### task.yaml

Every task folder must contain a `task.yaml` file. This file contains structured information about the task.

**Schema:**
```yaml
id: "0003"              # unique identifier for the task
name: "Task Name"
description: "A brief description of the task and its objectives."
branch: "branch-name"   # The git branch where the task will be implemented
priority: 5             # scale from 1 (lowest) to 10 (critical)
dependencies:           # list of task IDs that must be completed before this task can start
  - "0000"
  - "0001"

files:                  # list of files that the agent will modify or create as part of this task
  - path: "path/to/file"
    change_summary: "Brief description of the intended changes to this file"
```

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

An append only markdown file that tracks the ongoing progress of the task. It should be updated regularly by the agent as it works through the task.

```markdown
# Progress Log

## [Date and time] - [Agent Name]

Progress update describing what has been accomplished, any challenges encountered, and next steps.

```

### BLOCKER.md

This file must be created immediately before moving a task to the `8-blocked/` directory. It should contain a detailed description of the issue that is blocking progress, along with any relevant context or information that would help a human understand and resolve the issue.

```markdown
# Blocker Report

## Description

A detailed description of the issue that is blocking progress on the task including context, error messages, and any relevant information.

## Questions

A list of specific, actionable questions that a human can answer to help unblock the task. The agent should aim to make these questions as clear and specific as possible to facilitate quick resolution.
```

When a task is blocked, the agent should also update the `PROGRESS.md` file with a note about the blocker and the creation of the `BLOCKER.md` file, so that there is a clear record of when and why the task was blocked.

### `memory/` directory

Each task folder should also contain a `memory/` directory where the agent can store any relevant information, notes, or intermediate outputs that are generated during the execution of the task. This can include things like research findings, code snippets, or any other information that the agent deems important to keep track of as it works through the task. as the task is passed between agents in different stages of the lifecycle, this memory can be used to provide context and continuity, ensuring that important information is not lost and that each agent has the necessary background to effectively contribute to the task.

## Available Scripts

The `scripts/` directory contains utility scripts that agents can use to manage tasks.

### init.js

This script initializes the tasks folder structure by creating the necessary directories for each stage of the task lifecycle, and installs any dependencies for the other scripts. It should be run whenever a new project is set up to ensure that the workspace is properly organized.

```bash
node .agents/tasks/scripts/init.js
```

### new-task.js

This script creates a new task folder in the `0-backlog/` directory with a unique identifier and boilerplate files (`task.yaml`, `README.md`, `PROGRESS.md`, and a `memory/` directory). It takes as arguments the task name and the priority level. For example, to create a new task called "Implement User Authentication" with a priority of 7, you would run:

```bash
node .agents/tasks/scripts/new-task.js "Implement User Authentication" 7
```

## Moving Task Folders

Agents must move task folders between lifecycle directories using the shell `mv` command. This ensures the workspace reflects the lifecycle transition consistently. If preserving git history is required, `git mv` may be used instead, but agents should default to `mv` for moves during automated workflows.

## Worktrees

Each planned task gets a dedicated Git worktree, enabling parallel execution
across tasks. Worktrees live in the `worktrees/` directory at the project root
(outside `.agents/tasks/`).

### Naming Convention

Worktree folder names mirror the task folder name exactly:

  worktrees/{id}_{slug}/
  e.g. worktrees/0003_add-user-auth/

The branch name (stored in task.yaml) may differ from the slug and may contain
characters unsuitable for paths (e.g. feature/sign-in-with-apple). Always
derive the worktree path from the task folder name, never the branch name.

### Lifecycle

| Stage | Worktree State |
| :--- | :--- |
| 0-backlog → 2-planned | Does not exist yet |
| 2-planned (post-approval) | Created by the Architect |
| 3-test-authoring → 6-verification | Active; all agent work happens here |
| 7-done | Removed by the Architect after merge |
| 8-blocked | Preserved until the block is resolved |

### Agent Responsibilities

The Architect is the only agent that creates or removes worktrees. All other
agents (SDET, Developer, Reviewer) receive the worktree path from the Architect
and work exclusively inside it. No agent other than the Architect should run
`git worktree add` or `git worktree remove`.

## Task Lifecycle Workflow

Agent behavior at each lifecycle stage is defined in the Architect agent
prompt. This file defines workspace structure and file schemas only.
