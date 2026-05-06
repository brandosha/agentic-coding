const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');

const {
  tasksDir,
  worktreesDir,
  agenticCodingBranch
} = require('./utils');

function main(taskId) {
  const now = new Date().toISOString();

  // Update the task.yaml in the worktree branch to reflect completion, then remove the worktree
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

  const taskYamlPath = path.join(worktreePath, `docs/agent-tasks/${taskId}/task.yaml`);
  if (!fs.existsSync(taskYamlPath)) {
    console.error(`Error: task.yaml not found for task ${taskId} at expected path ${taskYamlPath}`);
    process.exit(1);
  }
  
  const taskDoc = YAML.parseDocument(fs.readFileSync(taskYamlPath, 'utf8'));
  
  const phaseIndex = taskDoc.contents.items.findIndex(pair => pair.key && pair.key.value === 'phase');
  if (phaseIndex === -1) {
    console.error(`Error: "phase" field not found in task.yaml for task ${taskId}.`);
    process.exit(1);
  }
  
  const phaseNode = taskDoc.contents.items[phaseIndex];
  if (phaseNode.value != 'verification') {
    console.error(`Error: Task ${taskId} is in phase "${phaseNode.value}" and cannot be completed. Only tasks in "verification" phase can be marked as completed.`);
    process.exit(1);
  }

  phaseNode.value = 'completed';
  const completedNode = taskDoc.createPair('completed', now);
  taskDoc.contents.items.splice(phaseIndex + 1, 0, completedNode);
  fs.writeFileSync(taskYamlPath, taskDoc.toString());

  execSync(`git add .`, { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git commit -m "${taskId}: Mark as completed"`, { cwd: worktreePath, stdio: 'inherit' });
  execSync('git push origin', { cwd: worktreePath, stdio: 'inherit' });
  execSync(`git worktree remove ${worktreePath} --force`, { stdio: 'inherit' });
  console.log(`Removed worktree for task ${taskId} at ${worktreePath}`);


  // Update the task pointer file to mark the task as completed
  agenticCodingBranch.pull();
  const pointerPath = path.join(tasksDir, `${taskId}.yaml`);
  if (!fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer file not found for task ID "${taskId}". Expected at: ${pointerPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(pointerPath, 'utf8');
  const taskPointer = YAML.parse(content);
  if (taskPointer.completed) {
    console.error(`Error: Task "${taskId}" is already marked as completed.`);
    process.exit(1);
  }
  
  taskPointer.completed = now;
  fs.writeFileSync(pointerPath, YAML.stringify(taskPointer));

  agenticCodingBranch.commit(`task: complete ${taskId}`);
  agenticCodingBranch.push();
  console.log(`Task ${taskId} marked as completed.`);
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node complete-task.js {taskId}');
  process.exit(1);
}

main(taskId);