git worktree add --detach .agents
cd .agents
git checkout --orphan agents
git rm -rf .
git commit --allow-empty -m "Initialize agents worktree"
