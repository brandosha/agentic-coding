---
name: using-skills
description: "Central registry and introduction to all available agent skills. Agents should read this to understand their available capabilities."
---

# Using Skills

This is the central registry for all available agent skills in this workspace. Skills define strict, step-by-step workflows that agents MUST follow to complete a specific type of task or phase of development. 

While individual tools and environments (like Claude Code, Copilot, or Codex) may use frontmatter for native skill discovery, **this file acts as the explicit source of truth** for tools that do not natively parse frontmatter.

When an orchestrating agent delegates work to a sub-agent, it MUST explicitly instruct the sub-agent to reference this file and load the appropriate skill from its directory.

## Core Capabilities

### Task Lifecycle Management
- **[Managing Task Lifecycle (`../managing-task-lifecycle/SKILL.md`)](../managing-task-lifecycle/SKILL.md)**
  Used by the main agent to act as the Task Lifecycle Manager. Orchestrates the flow of a task from backlog to completion and delegates work to other skills.

### Discovery & Planning
- **[Performing Discovery (`../performing-discovery/SKILL.md`)](../performing-discovery/SKILL.md)**
  Used by sub-agents to scout codebases and APIs to gather ground truth data for the Manager.
- **[Brainstorming (`../brainstorming/SKILL.md`)](../brainstorming/SKILL.md)**
  Used during the initial discovery phase (`1-discovery/`). Explores user intent, clarifies constraints, and produces a final research/spec document BEFORE any code is written.

- **[Planning Tasks (`../planning-tasks/SKILL.md`)](../planning-tasks/SKILL.md)**
  Used by the Manager after discovery to collaborate with the human to write comprehensive implementation plans, finalizing the task's README.md and task.yaml.

### Development & Execution
- **[Authoring Tests (`../authoring-tests/SKILL.md`)](../authoring-tests/SKILL.md)**
  Used by sub-agents to author test suites, establish pinning tests, and scaffold TDD infrastructure during the test authoring phase.

- **[Executing Plans (`../executing-plans/SKILL.md`)](../executing-plans/SKILL.md)**
  Used by sub-agents to implement code changes, refactor, and pass test suites during the development phase.

- **[Reviewing Code (`../reviewing-code/SKILL.md`)](../reviewing-code/SKILL.md)**
  Used by sub-agents to audit implementations for security, quality, and adherence to the plan during the review phase.

### Meta
- **[Writing Skills (`../writing-skills/SKILL.md`)](../writing-skills/SKILL.md)**
  Instructions for agents on how to author new skills or modify existing ones to ensure they adhere to strict behavior-shaping principles.
