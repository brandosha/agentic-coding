const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile } = require('./utils/tasks');
const { rootDir, tasksDir, worktreesDir } = require('./utils/paths');
const { remoteBranchExists, runGitCommand } = require('./utils/git');

function main(taskId) {
  const worktreeDir = path.join(worktreesDir, taskId);
  if (!fs.existsSync(worktreeDir)) {
    console.error(`Error: No worktree found for task ${taskId} at expected path ${worktreeDir}`);
    process.exit(1);
  }

  const statusOutput = execSync('git status --porcelain', { cwd: worktreeDir }).toString().trim();
  if (statusOutput) {
    console.warn(`Warning: Uncommitted changes found in worktree for task ${taskId}.`);
    console.error(statusOutput);
  }

  const pointerPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer file not found for task ID "${taskId}". Expected at: ${pointerPath}`);
    process.exit(1);
  }

  const pointer = readPointerFile(pointerPath);
  const { branch } = pointer;

  const hasRemoteBranch = remoteBranchExists(branch);
  if (!hasRemoteBranch) {
    console.error(`Error: Branch ${branch} does not exist on origin.`);
    process.exit(1);
  }

  runGitCommand(`git push . agentic-coding/${branch}:${branch}`, worktreeDir);
  runGitCommand(`git push origin ${branch}`, worktreeDir);
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node sync-worktree.js <task-id>');
  process.exit(1);
}

main(taskId);
