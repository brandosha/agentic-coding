const fs = require('fs');
const path = require('path');

function createTask(taskName, priority, branchName) {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  const slug = taskName.replace(/\W+/g, '-').toLowerCase();
  const taskSlug = `${datePrefix}_${slug}`;

  const tasksDir = path.resolve(__dirname, '..', '..', '..', 'tasks');
  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }

  const pointerPath = path.join(tasksDir, `${taskSlug}.yaml`);
  if (fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer already exists at ${pointerPath}`);
    process.exit(1);
  }

  const pointerContent = `branch: "${branchName}"
priority: ${priority}
created: "${today.toISOString().slice(0, 10)}"
`;
  fs.writeFileSync(pointerPath, pointerContent);

  console.log(`Created pointer: .agents/tasks/${taskSlug}.yaml`);
  console.log(`Slug: ${taskSlug}`);
  console.log(`Branch: ${branchName}`);
  console.log(`Priority: ${priority}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Commit the pointer on the agents branch`);
  console.log(`  2. Create worktree: git worktree add worktrees/${taskSlug} <root_branch>`);
  console.log(`  3. Create task folder: mkdir -p worktrees/${taskSlug}/docs/agent-tasks/${taskSlug}/memory`);
}

const taskName = process.argv[2];
const priority = process.argv[3];
const branchName = process.argv[4];

if (!taskName || !priority || !branchName) {
  console.error('Usage: node new-task.js "<Task Name>" <priority> "<branch-name>"');
  console.error('  <Task Name>    - Name of the task (required)');
  console.error('  <priority>     - Priority 1-10 (required)');
  console.error('  <branch-name>  - Git branch name (required)');
  process.exit(1);
}

if (isNaN(priority) || priority < 1 || priority > 10) {
  console.error('Please provide a valid priority (1-10) as the second argument.');
  process.exit(1);
}

createTask(taskName, parseInt(priority, 10), branchName);
