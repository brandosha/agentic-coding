---
name: planning-tasks
description: "Use after discovery to collaborate with the human to write comprehensive implementation plans, finalizing the task's README.md and task.yaml."
---

# Planning Tasks

This skill is adopted by the Task Lifecycle Manager during the planning phase (`1-discovery/` moving to `2-planned/`). The planning phase is the most critical part of the process. Done well, it prevents wasted time and work during execution.

Your goal is to work in close communication with the Human to translate discovery findings into a granular, specific execution plan for the Developer and SDET sub-agents. 

## 1. Operational Workflow

### Step 1: Context Mastery
- Read the backlog request to understand the ultimate intent.
- Read all output from the Discovery sub-agent in `memory/`.
- Identify any gaps or ambiguities between the Human's request and the ground truth found in discovery.

### Step 2: Human Collaboration
You must work in close communication with the Human. If there are multiple ways to implement the feature or if constraints are unclear, ask the Human. 
- Follow your core communication rules: present an overview of your questions, then ask them one at a time.
- Do not guess architecture. Get explicit confirmation.

### Step 3: Drafting the Plan
Once the approach is clear, draft the implementation plan. You are writing this for the SDET and Developer sub-agents. 
- You must finalize the `README.md`. This includes the "Approach", "Completion Criteria", and critically, the "Tests" section. You must explicitly define what tests need to be written by the SDET before the Developer begins.
- You must finalize the `task.yaml`. This must include the exact implementation files AND the exact test files that will be modified or created.
- Ensure the branch name follows the conventions defined in `.agents/project-config.yaml`.

### Step 4: Final Approval
Present the drafted `README.md` and `task.yaml` scope to the Human for final approval.

<HARD-GATE>
Do NOT advance the task lifecycle or create any branches/worktrees until the Human has explicitly approved the finalized implementation plan.
</HARD-GATE>

## 2. Anti-Patterns: Placeholders
Every step in the `README.md` "Approach" must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases" (you must specify exactly what validation and what edge cases based on discovery)
- "Write tests for the above" (without specifying what the tests should actually cover)

## 3. Bite-Sized Task Granularity
Give the sub-agents the whole plan as bite-sized tasks. Each step should represent one action (2-5 minutes of execution time). For example:
- "Write the failing test"
- "Run it to make sure it fails"
- "Implement the minimal code to make the test pass"
- "Run the tests and make sure they pass"

## 4. Task Structure Requirements
For each component or feature, explicitly state in `task.yaml` and `README.md`:
**Files:**
- Create: `exact/path/to/file.ext`
- Modify: `exact/path/to/existing.ext`

Use explicit checkboxes (`- [ ]`) for every step in the `README.md` Approach section. Provide complete code architecture in every step — if a step changes code, show the exact code snippet or interface required.
