const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile } = require('./utils/tasks');
const { rootDir, tasksDir, worktreesDir } = require('./utils/paths');

function runGitCommand(command, cwd = rootDir) {
  return execSync(command, { cwd, stdio: 'inherit' });
}

function branchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { cwd: rootDir });
    return true;
  } catch (error) {
    return false;
  }
}

function remoteBranchExists(branchName) {
  try {
    execSync(`git ls-remote --exit-code origin ${branchName}`, { cwd: rootDir, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function main(taskId) {
  const pointerPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer file not found for task ID "${taskId}". Expected at: ${pointerPath}`);
    process.exit(1);
  }

  const pointer = readPointerFile(pointerPath);
  const { branch } = pointer;

  const worktreePath = path.join(worktreesDir, taskId);
  if (fs.existsSync(worktreePath)) {
    console.error(`Error: Worktree path already exists at ${worktreePath}`);
    process.exit(1);
  }

  fs.mkdirSync(worktreesDir, { recursive: true });

  const hasRemoteBranch = remoteBranchExists(branch);
  if (hasRemoteBranch) {
    runGitCommand(`git fetch origin ${branch}`);
  }

  if (branchExists(branch)) {
    runGitCommand(`git worktree add "${worktreePath}" ${branch}`);
  } else {
    if (!hasRemoteBranch) {
      console.error(`Error: Branch ${branch} does not exist on origin.`);
      process.exit(1);
    }

    runGitCommand(`git worktree add -b ${branch} "${worktreePath}" origin/${branch}`);
  }

  console.log(`Installed worktree for ${taskId} at ${worktreePath}`);
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node install-worktree.js <task-id>');
  process.exit(1);
}

main(taskId);
