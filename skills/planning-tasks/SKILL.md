---
name: planning-tasks
description: "Use after discovery to collaborate with the human to write comprehensive implementation plans, finalizing the task.json."
---

# Planning Tasks

This skill is adopted by the Task Manager during the planning phase. The planning phase is the most critical part of the process. Done well, it prevents wasted time and work during execution.

Your goal is to work in close communication with the Human to translate discovery findings into a granular, specific execution plan for the Developer and SDET sub-agents.

## Operational Workflow

### Step 1: Context Mastery
- Read the backlog request to understand the ultimate intent.
- Read all output from the Discovery sub-agent in `memory/`.
- Identify any gaps or ambiguities between the Human's request and the ground truth found in discovery.

### Step 2: Human Collaboration
You must work in close communication with the Human. If there are multiple ways to implement the feature or if constraints are unclear, ask the Human. 
- Follow your core communication rules: present an overview of your questions, then ask them one at a time.
- Do not guess architecture. Get explicit confirmation.

### Step 3: Drafting the Plan
Once the approach is clear, draft the implementation plan. You are writing this for the SDET, Developer, and Reviewer sub-agents. 
- You must finalize the `task.json`. This must include the exact implementation files AND the exact test files that will be modified or created. Use `implementation[].changes` to capture file-scoped change targets. It must also include the task goal, the implementation plan, test cases, and completion criteria.

### Step 4: Final Approval
Present the drafted `task.json` scope to the Human for final approval.

<HARD-GATE>
Do NOT advance the task lifecycle until the Human has explicitly approved the finalized implementation plan.
</HARD-GATE>

## Anti-Patterns: Placeholders
Every step in `task.json` implementation entries and test definitions must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases" (you must specify exactly what validation and what edge cases based on discovery)
- "Write tests" (without specifying what the tests should actually cover)
