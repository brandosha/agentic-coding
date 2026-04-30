mkdir -p worktrees
# If .gitignore exists, append wroktrees and .agents, otherwise create one
if [ -f .gitignore ]; then
  echo "\n" >> .gitignore;
else
  touch .gitignore;
fi
echo "# Agentic coding worktrees" >> .gitignore;
echo "worktrees/" >> .gitignore;
echo ".agents/" >> .gitignore;

git worktree add --detach .agents;
cd .agents;
git checkout --orphan agents;
git rm -rf .;
git commit --allow-empty -m "Initialize agents worktree";
cd ..;
