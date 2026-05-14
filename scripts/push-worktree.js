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
  if (!fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer file not found for task ID "${taskId}".`);
    process.exit(1);
  }

  const pointer = readPointerFile(pointerPath);
  const { branch } = pointer;
  const shadowBranch = `agent/${branch}`;

  // GLOBAL AUTOMATION PROTECTION
  process.env.GIT_EDITOR = 'true';
  process.env.GIT_MERGE_AUTOEDIT = 'no';

  // Sanity check: Ensure agent has committed its own work in the worktree
  const gitStatus = execSync('git status --porcelain', { cwd: worktreeDir }).toString().trim();
  if (gitStatus) {
    console.error(`Error: Uncommitted changes found in worktree for task ${taskId}. Commit before pushing.`);
    process.exit(1);
  }

  // 1. Configure local root to allow background updates if the push succeeds
  runGitCommand(`git config receive.denyCurrentBranch updateInstead`, rootDir);

  // 2. REMOTE SYNC (Source of Truth)
  if (remoteBranchExists(branch)) {
    try {
      console.log(`Fetching latest from origin/${branch}...`);
      runGitCommand(`git fetch origin ${branch}`, worktreeDir);
      
      console.log(`Rebasing agent work strictly on top of origin/${branch}...`);
      runGitCommand(`git rebase origin/${branch}`, worktreeDir);
    } catch (error) {
      console.error("CRITICAL: Conflict detected with the remote repository (origin).");
      console.info("Resolve in worktree, run 'git rebase --continue --no-edit', then retry.");
      console.info("If you are unsure how to resolve, this is a blocker, create BLOCKER.md and report.")
      process.exit(1);
    }
  } else {
    console.log(`Branch ${branch} does not exist on origin yet. Treating current worktree state as initial history.`);
  }

  // 3. LOCAL SYNC (Best-Effort)
  let localSyncSucceeded = false;
  try {
    console.log(`Attempting best-effort sync to local branch...`);
    // Using 'pipe' to suppress loud git error dumps if it gets rejected
    execSync(`git push . ${shadowBranch}:${branch}`, { cwd: worktreeDir, stdio: 'pipe' });
    console.log("Success: Local branch updated");
    localSyncSucceeded = true;
  } catch (error) {
    // If you have uncommitted changes OR unpushed commits locally, this catches it.
    console.warn("Notice: Local branch is modified or has unpushed commits. Skipping local sync.");
  }

  // 4. REMOTE DELIVERY (Publishing the Work)
  console.log(`Publishing clean agent changes to origin/${branch}...`);
  runGitCommand(`git push origin ${shadowBranch}:${branch} --force-with-lease`, worktreeDir);

  // 5. Final Output Wrap-up
  console.log("SUCCESS: Agent work has been published to origin!");
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: node push-worktree.js <task-id>');
  process.exit(1);
}

try {
  main(taskId);
} catch (error) {
  console.error("An unexpected error occurred:");
  console.error(error);
  process.exit(1);
}
