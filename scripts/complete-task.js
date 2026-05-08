const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { agenticCodingBranch } = require('./utils/git');
const { tasksDir, worktreesDir } = require('./utils/paths');
const { readPointerFile, readTaskFile, writePointerFile, writeTaskFile } = require('./utils/tasks');

function main(taskId) {
  const now = new Date().toISOString();

  // Update the task.json in the worktree branch to reflect completion, then remove the worktree
  const worktreePath = path.join(worktreesDir, taskId);
  if (!fs.existsSync(worktreePath)) {
    console.error(`Error: No worktree found for task ${taskId} at expected path ${worktreePath}`);
    process.exit(1);
  }

  // Check for uncommitted changes in the worktree
  const statusOutput = execSync('git status --porcelain', { cwd: worktreePath }).toString().trim();
  if (statusOutput) {
    console.error(`Error: Uncommitted changes found in worktree for task ${taskId}. Please commit changes before completing the task.`);
    console.error(statusOutput);
    process.exit(1);
  }

  execSync('git pull --rebase origin', { cwd: worktreePath, stdio: 'inherit' });

  const taskJsonPath = path.join(worktreePath, `docs/agent-tasks/${taskId}/task.json`);
  if (!fs.existsSync(taskJsonPath)) {
    console.error(`Error: task.json not found for task ${taskId} at expected path ${taskJsonPath}`);
    process.exit(1);
  }

  const task = readTaskFile(taskJsonPath);
  if (task.phase !== 'verification') {
    console.error(`Error: Task ${taskId} is in phase "${task.phase}" and cannot be marked done. Only tasks in "verification" phase can be marked done.`);
    process.exit(1);
  }

  task.phase = 'done';
  task.completed = now;
  writeTaskFile(taskJsonPath, task);

  execSync(`git add .`, { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git commit -m "${taskId}: Mark as done"`, { cwd: worktreePath, stdio: 'inherit' });
  execSync('git push origin', { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git worktree remove ${worktreePath} --force`, { stdio: 'inherit' });
  console.log(`Removed worktree for task ${taskId} at ${worktreePath}`);


  // Update the task pointer file to mark the task as done
  agenticCodingBranch.pull();
  const pointerPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer file not found for task ID "${taskId}". Expected at: ${pointerPath}`);
    process.exit(1);
  }

  const taskPointer = readPointerFile(pointerPath);
  if (taskPointer.completed) {
    console.error(`Error: Task "${taskId}" is already marked done.`);
    process.exit(1);
  }
  
  taskPointer.completed = now;
  writePointerFile(pointerPath, taskPointer);

  agenticCodingBranch.commit(`task: complete ${taskId}`);
  agenticCodingBranch.push();
  console.log(`Task ${taskId} marked done.`);
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node complete-task.js {taskId}');
  process.exit(1);
}

main(taskId);
