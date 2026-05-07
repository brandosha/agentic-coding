# Agentic Coding

Agentic Coding is a framework for AI agents to autonomously contribute to software development projects with structured workflows, clear guidelines, and a focus on traceability and communication. This repository contains the core guidelines, skills, and tools for agents to effectively collaborate on coding tasks while adhering to best practices and maintaining alignment with human goals.

Opt in to Agentic Coding by mentioning the `agentic-coding` file either directly in your root `AGENTS.md` or whenever you are starting an agent session.

### Updates

`.agentic-coding` is a git worktree of the `agentic-coding` branch. When it was intalled, it was setup with a remote `agentic-coding` pointing to the [agentic-coding](https://github.com/brandosha/agentic-coding) repository.

To update the `agentic-coding` branch with the latest prompts and skills, run the following commands:
```bash
cd .agentic-coding
git pull --no-rebase --no-edit agentic-coding agentic-coding
```
