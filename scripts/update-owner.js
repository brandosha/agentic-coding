const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPersonalConfig } = require('./utils/config');
const { readTaskFile, writeTaskFile } = require('./utils/tasks');
const { worktreesDir } = require('./utils/paths');

function main(taskId) {
  const worktreePath = path.join(worktreesDir, taskId);
  if (!fs.existsSync(worktreePath)) {
    console.error(`Error: No worktree found for task ${taskId} at expected path ${worktreePath}`);
    process.exit(1);
  }

  const taskPath = path.join(worktreePath, 'docs', 'agent-tasks', taskId, 'task.json');
  if (!fs.existsSync(taskPath)) {
    console.error(`Error: task.json not found for task ${taskId} at expected path ${taskPath}`);
    process.exit(1);
  }

  const personalConfig = readPersonalConfig();
  const task = readTaskFile(taskPath);

  if (task.owner === personalConfig.name) {
    console.log(`Owner is already set to ${personalConfig.name} for ${taskId}.`);
    return;
  }

  task.owner = personalConfig.name;
  writeTaskFile(taskPath, task);

  const taskSlug = taskId.split('_', 2)[1] || taskId;
  execSync(`git add "${path.relative(worktreePath, taskPath)}"`, { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git commit -m "${taskSlug}: Updated owner to ${personalConfig.name}"`, { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git push`, { cwd: worktreePath, stdio: 'inherit' });

  console.log(`Updated owner for ${taskId} to ${personalConfig.name}.`);
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node update-owner.js <task-id>');
  process.exit(1);
}

main(taskId);
