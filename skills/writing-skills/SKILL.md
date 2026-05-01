---
name: writing-skills
description: "Use when creating a new agent skill or modifying an existing one to ensure it adheres to strict behavior-shaping principles."
---

# Writing Skills

When you are asked to create a new skill for an agent, you must follow strict principles. Skills are not just prose or advice; they are behavioral guardrails designed to force an LLM to work methodically and carefully.

## Anti-Patterns

- **Vague Suggestions**: Never use words like "Try to...", "Consider...", or "Usually it's best to...". LLMs treat suggestions as optional. Use "MUST", "NEVER", and explicit commands.
- **Missing Hard Gates**: A skill that doesn't define when to STOP and ask the user for approval is a dangerous skill.
- **Skipping the "Why"**: Agents need to understand the intent behind a constraint to follow it consistently.

## Skill Anatomy Checklist

Every skill `SKILL.md` MUST include:

1. **Frontmatter**: YAML frontmatter containing `name` and `description` to enable native discovery by advanced tools.
2. **Title & Brief**: A clear H1 and a 1-2 sentence description of what the skill achieves.
3. **`<HARD-GATE>` Block**: An explicit HTML-style tag block that defines a strict stop condition (e.g., "Do NOT write any code until the user approves the plan").
4. **Anti-Patterns Section**: A list of common mistakes or "lazy" LLM behaviors specific to this task, explicitly forbidding them.
5. **Checklist / Process Flow**: A literal step-by-step checklist (`- [ ]`) or a precise numbered list defining the exact sequence of actions.
6. **Next Steps**: An explicit instruction on what skill or phase comes next when this skill is completed.

## Registration Requirement

After creating a new `.md` file in the `.agents/skills/` directory, you **MUST update `.agents/skills/SKILLS.md`** to add the new skill to the central registry so that orchestrating agents can discover it.
