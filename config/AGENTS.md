# Config Schemas

This directory stores agent configuration files. Use the schemas below when creating or editing them.

## project-config.yaml

Project-level defaults used by the task lifecycle manager.

```yaml
git:  # repository preferences
  root_branch: main  # the default branch to create worktrees from
  branch_naming: "feature/name, bugfix/name, chore/name"  # guidance for naming task branches (can be a pattern or examples)
```

## personal-config.yaml

User-specific preferences for task ownership.

```yaml
name: Steve Jobs  # the human name to write into task.yaml owner fields
```
