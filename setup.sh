#!/bin/bash

# 1. Setup Remotes
git remote add agentic-coding https://github.com/brandosha/agentic-coding.git 2>/dev/null || true
git fetch agentic-coding

# 2. Update .gitignore
if ! grep -q ".agents/" .gitignore 2>/dev/null; then
  echo -e "\n# Agentic coding sidecar\n.agents/\nworktrees/" >> .gitignore
fi

# 3. Setup the Sidecar Worktree
if [ ! -d ".agents" ]; then
    echo "Initializing .agents workspace..."
    git worktree add --detach .agents
    
    cd .agents
    # Check if 'agents' branch exists on origin
    if git ls-remote --exit-code origin agents > /dev/null 2>&1; then
        git checkout agents
    else
        git checkout --orphan agents
        git rm -rf .
        git pull agentic-coding agents
    fi
    git push -u origin agents
    cd ..
fi

# 4. Link the Brain to the Root
INSTRUCTION="> **CRITICAL INSTRUCTION:** \`.agents/AGENTIC_CODING.md\` contains critical operating procedures. Before doing anything else, you MUST read \`.agents/AGENTIC_CODING.md\` and follow its instructions.\n"

if [ -f AGENTS.md ]; then
    if ! grep -q "AGENTIC_CODING.md" AGENTS.md; then
        echo -e "$INSTRUCTION\n$(cat AGENTS.md)" > AGENTS.md
        echo "Linked AGENTIC_CODING.md in AGENTS.md"
    fi
else
    echo -e "$INSTRUCTION" > AGENTS.md
    echo "Created AGENTS.md with core link."
fi

echo "Done. All core logic and history now live in the .agents/ directory."