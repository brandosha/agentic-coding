### Updates

`.agents` is a git worktree of the `agents` branch. When it was intalled, it was setup with a remote `agentic-coding` pointing to the [agentic-coding](https://github.com/brandosha/agentic-coding) repository.

To update the `agents` branch with the latest prompts and skills, run the following commands:
```bash
cd .agents
git pull --no-rebase --no-edit agentic-coding agents
```
