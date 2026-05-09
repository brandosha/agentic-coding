# Config Schemas

This directory stores agent configuration files. Use the schemas below when creating or editing them. These configuration files are required for scripts to function properly.

## project-config.json

Project-level defaults referenced by the task manager.

```json
{
  "git": {
    "rootBranch": "main",
    "branchNaming": "feature/name, bugfix/name, chore/name"
  }
}
```

## personal-config.json

User-specific preferences for task ownership.

```json
{
  "name": "Steve Jobs"
}
```
