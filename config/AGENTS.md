# Config Schemas

This directory stores agent configuration files. Use the schemas below when creating or editing them.

## project-config.json

Project-level defaults used by the task lifecycle manager.

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
