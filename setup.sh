#!/bin/bash

# 1. Setup Remotes
git remote add agentic-coding https://github.com/brandosha/agentic-coding.git 2>/dev/null || true
git fetch agentic-coding

# 2. Update .gitignore
if ! grep -q ".agentic-coding/" .gitignore 2>/dev/null; then
  echo -e "\n# Agentic coding sidecar\n.agentic-coding/\nworktrees/" >> .gitignore
fi

# 3. Setup the Sidecar Worktree
if [ ! -d ".agentic-coding" ]; then
    echo "Initializing .agentic-coding workspace..."
    git worktree add --detach .agentic-coding
    
    cd .agentic-coding
    # Check if 'agentic-coding' branch exists on origin
    if git ls-remote --exit-code origin agentic-coding > /dev/null 2>&1; then
        git checkout agentic-coding
    else
        git checkout --orphan agentic-coding
        git rm -rf .
        git pull agentic-coding agentic-coding
    fi
    git push -u origin agentic-coding
    cd ..
fi

echo "Done. All agentic coding skills and task management logic now live in the .agentic-coding/ directory."