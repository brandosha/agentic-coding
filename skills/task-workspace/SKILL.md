---
name: task-workspace
description: "Authoritative reference for workspace structure, task.json schema, and blocker/outcome protocols."
---

# Task Workspace Structure & Schemas

## Task Folder Contents

Located at `docs/agent-tasks/{task-id}/` in the worktree:

- **`task.json`**: Schema-validated source of truth for planning and status.
- **`PROGRESS.md`**: Append-only log of every agent action with timestamps.
- **`BLOCKER.md`**: **CRITICAL.** Created immediately when progress stops. Requires immediate Human escalation.
- **`OUTCOME.md`**: **ARCHIVAL.** Created after review items are approved to summarize results and next steps.
- **`memory/`**: Directory for research, review notes, and test scaffolding notes.

The task ID is formatted as `{YYYYMMDD}_{slug}` (e.g. `20260502_add-user-auth`).

## Task Branch & Worktree

Each task has a corresponding Git branch (e.g. `feature/add-user-auth`) and an isolated worktree at `worktrees/{task-id}/` where all file changes must be made during test-authoring and development phases. The Manager is responsible for creating branches and worktrees by using the provided scripts; sub-agents only work within the provided worktree.

All changes must be committed to the task branch inside the worktree. Do not modify files in the main repository checkout or create/switch branches from within sub-agents. Commit messages should have the format: `{task-slug}: [Short Description of Change]` (e.g. `add-user-auth: Scaffolded initial test suite`).

## `task.json` Schema

Valid phases: `planning`, `test-authoring`, `development`, `done`.

```json
{
  "name": "Task Name",
  "description": "High-level summary of objectives.",
  "branch": "feature/branch-name",
  "phase": "planning", // planning | test-authoring | development | done
  "owner": "Human Name", // The person overseeing or approving the task
  "dependencies": [], // List of task IDs for tasks that must be completed first
  "implementation": [
    {
      "file": "path/to/source_file.ext",
      "changes": [
        {
          "target": "function_or_module_name", // Entity being changed
          "description": "Specific logic requirement. No placeholders.",
          "implemented": false, // Set to true by Developer
          "reviewStatus": "none", // none | approved | rejected (Set by Reviewer)
          "reviewFeedback": [] // Detailed issues found by Reviewer
        }
      ]
    }
  ],
  "tests": [
    {
      "written": false, // Set to true by SDET
      "file": "path/to/test_file.ext",
      "targets": ["function_or_module_name"], // Entities covered
      "description": "Specific success criteria."
    }
  ]
}
```

**IMPORTANT**: Whenever the task.json file is modified, the agent making the change MUST use the `validate-task.js` script to ensure the file matches the schema and is formatted correctly.

## Protocols

### Blocker Protocol (`BLOCKER.md`)

- **Notification**: The Manager MUST immediately report `BLOCKER.md` questions to the Human.
- **Phase Integrity**: Do NOT change the `phase` in `task.json`. The presence of `BLOCKER.md` indicates the blocked state.
- **Content**: Includes a Technical Description of the hurdle, the Impact on implementation targets, and specific Questions for the Human.

```markdown
# BLOCKER: [Short Title]

## Technical Description
[Detailed technical explanation of the blocker, including any relevant code snippets or error messages.]

## Impact
[Description of how this blocker impacts the implementation, including which files or functions are affected.]

## Questions
1. [Specific and actionable question 1]
2. [Specific and actionable question 2]
```

### Outcome Protocol (`OUTCOME.md`)

- **Purpose**: Created by the Manager after all review items are approved but before the worktree is removed.
- **Contents**: Summarizes results, technical decisions, technical debt, and future tasks.

```markdown
# [Short Title]

## Summary of Results
[High-level summary of what was accomplished, including any deviations from the original plan and their justifications.]

## Technical Decisions
[Detailed explanation of any significant technical decisions made during implementation, including rationale and alternatives considered.]

## Follow Up
[Description of any follow-up tasks that should be undertaken, including potential improvements, refactors, or related features that were out of scope for this task.]
```

## Worktree Lifecycle

- **Discovery**: `new-task.js` creates the pointer and the worktree.
- **Execution**: Sub-agents work **exclusively** in the worktree on the task branch.
- **Merge (Human)**: The Human merges the feature branch into the root branch.
- **Done**: `complete-task.js` deletes the worktree and marks the pointer `completed`.


## Operational Scripts

Helper scripts for managing the task lifecycle, located in `.agentic-coding/scripts/`:

**`new-task.js`**: Bootstraps the task pointer and worktree.
```bash
node .agentic-coding/scripts/new-task.js "<task-name>" <priority> "<task-description>"
```

**`task-status.js`**: Reads all active branches to report high-level progress.
```bash
node .agentic-coding/scripts/task-status.js
```

**`validate-task.js`**: **Mandatory.** Verifies that `task.json` follows the schema.
```bash
node .agentic-coding/scripts/validate-task.js <task-id>
```

**`complete-task.js`**: Performs worktree cleanup and marks the task as finished.
```bash
node .agentic-coding/scripts/complete-task.js <task-id>
```

## Memory Artifacts

- **`memory/{topic}_research.md`**: Saved by the **Manager** after a Discovery scout.
- **`memory/review_notes.md`**: Detailed audit trail and out-of-scope observations from the **Reviewer**.
- **`memory/test_scaffolding_notes.md`**: Mock and test-data documentation from the **SDET**.

