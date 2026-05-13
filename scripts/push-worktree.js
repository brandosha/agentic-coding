const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile } = require('./utils/tasks');
const { rootDir, tasksDir, worktreesDir } = require('./utils/paths');
const { runGitCommand } = require('./utils/git');

function main(taskId) {
  const worktreeDir = path.join(worktreesDir, taskId);
  if (!fs.existsSync(worktreeDir)) {
    console.error(`Error: No worktree found at ${worktreeDir}`);
    process.exit(1);
  }

  const pointerPath = path.join(tasksDir, `${taskId}.json`);
  const pointer = readPointerFile(pointerPath);
  const { branch } = pointer;
  const shadowBranch = `agent/${branch}`;

  // 1. Ensure local root allows background updates for Fast Refresh
  runGitCommand(`git config receive.denyCurrentBranch updateInstead`, rootDir);

  try {
    console.log(`Syncing ${shadowBranch} to local ${branch}...`);
    // 2. Attempt Local Push-Merge
    runGitCommand(`git push . ${shadowBranch}:${branch}`, worktreeDir);
  } catch (error) {
    // 3. Handle Conflicts via Rebase-Sync Protocol
    console.warn("Conflict detected between worktree and root. Attempting automated rebase...");
    
    // Fetch latest from root without locking the branch
    runGitCommand(`git fetch . ${branch}`, worktreeDir);
    
    try {
      // Rebase shadow branch onto the latest root state
      runGitCommand(`git rebase FETCH_HEAD`, worktreeDir);
      
      // Retry the push after successful rebase
      runGitCommand(`git push . ${shadowBranch}:${branch}`, worktreeDir);
      console.log("Rebase successful. Local root updated.");
    } catch (rebaseError) {
      console.error("CRITICAL: Manual conflict resolution required in worktree.");
      console.info("Please resolve conflicts, run 'git rebase --continue', then retry sync.");
      process.exit(1);
    }
  }

  // 4. Remote Sync for Team Traceability
  console.log(`Syncing to origin/${branch}...`);
  runGitCommand(`git push origin ${shadowBranch}:${branch}`, worktreeDir);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: node push-worktree.js <task-id>');
  process.exit(1);
}

main(taskId);