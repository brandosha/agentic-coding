const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile } = require('./utils/tasks');
const { rootDir, tasksDir, worktreesDir } = require('./utils/paths');
const { runGitCommand, remoteBranchExists } = require('./utils/git');

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

  const gitStatus = execSync('git status --porcelain', { cwd: worktreeDir }).toString().trim();
  if (gitStatus) {
    console.error(`Error: Uncommitted changes found in worktree for task ${taskId}. Commit these changes before pushing.`);
    process.exit(1);
  }

  // 1. Ensure local root allows background updates to prevent push rejections
  runGitCommand(`git config receive.denyCurrentBranch updateInstead`, rootDir);

  // 2. REMOTE SYNC: Fetch latest from origin to identify remote conflicts
  if (remoteBranchExists(branch)) {
    try {
      console.log(`Fetching latest from origin/${branch}...`);
      runGitCommand(`git fetch origin ${branch}`, worktreeDir);
      
      // 3. INTEGRATION: Rebase shadow branch onto the remote version
      console.log(`Integrating remote changes into ${shadowBranch}...`);
      runGitCommand(`git rebase origin/${branch}`, worktreeDir);
    } catch (error) {
      console.error("CRITICAL: Manual conflict resolution required between agent and remote.");
      console.info("Resolve in worktree, run 'git rebase --continue --no-edit', then retry.");
      console.info("If you are unsure how to resolve, this is a blocker, create BLOCKER.md and report.")
      process.exit(1);
    }
  } else {
    console.warn(`Warning: The branch ${branch} does not exist on origin, skipping remote fetch.`)
  }

  try {
    // 4. LOCAL SYNC (Push-Merge): Update the root
    console.log(`Syncing ${shadowBranch} to local root branch...`);
    runGitCommand(`git push . ${shadowBranch}:${branch}`, worktreeDir);
  } catch (error) {
    // Handle case where your local root also has new commits the remote doesn't
    console.warn("Local root conflict detected. rebasing onto root state...");
    runGitCommand(`git fetch . ${branch}`, worktreeDir);
    try {
      runGitCommand(`git rebase FETCH_HEAD`, worktreeDir);
      runGitCommand(`git push . ${shadowBranch}:${branch}`, worktreeDir);
    } catch (rebaseError) {
      console.error("CRITICAL: Manual conflict resolution required between agent and local root.");
      console.info("Resolve in worktree, run 'git rebase --continue --no-edit', then retry.");
      console.info("If you are unsure how to resolve, this is a blocker, create BLOCKER.md and report.")
      process.exit(1);
    }
  }

  // 5. FINAL DELIVERY: Update origin with the new code
  runGitCommand(`git push origin ${shadowBranch}:${branch} --force-with-lease`, worktreeDir);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: node push-worktree.js <task-id>');
  process.exit(1);
}

main(taskId);