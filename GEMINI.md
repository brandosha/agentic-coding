In the Antigravity IDE, there does not yet exist a way for agents to directly invoke sub-agents. As a workaround, you can use the terminal tool with the Gemini CLI in headless mode:
```bash
gemini -p "your prompt here"
```

When directed to use sub-agents, use this technique. If this fails for any reason, stop immediately and report the problem.