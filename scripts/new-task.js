const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');

const {
  rootDir,
  agenticCodingDir,
  tasksDir,
  worktreesDir,
} = require('./utils');

function sanitizeSlug(taskName) {
  return taskName.trim().replace(/\W+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function readProjectRootBranch() {
  const configPath = path.join(rootDir, '.agentic-coding', 'config', 'project-config.yaml');
  if (!fs.existsSync(configPath)) {

    console.error('Error: project-config.yaml not found at .agentic-coding/config/project-config.yaml. Please create this file with a "root" field specifying the default branch (e.g., main or master).');
    process.exit(1);
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const config = YAML.parse(content);
  if (!config || !config.git || !config.git.root_branch) {
    console.error('Error: "root_branch" field not found in project-config.yaml. Please add a "root_branch" field specifying the default branch (e.g., main or master).');
    process.exit(1);
  }

  const { root_branch } = config.git;
  if (!branchExists(root_branch)) {
    console.error(`Error: The specified root branch "${root_branch}" does not exist in the local repository. Please ensure it exists or update project-config.yaml with a valid branch.`);
    process.exit(1);
  }

  return root_branch;
}

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

function createTask(taskName, priority, branchName) {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  const slug = sanitizeSlug(taskName);
  const taskSlug = `${datePrefix}_${slug}`;

  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }

  runGitCommand(`git pull origin`, agenticCodingDir);
  const pointerPath = path.join(tasksDir, `${taskSlug}.yaml`);
  if (fs.existsSync(pointerPath)) {
    console.error(`Error: Task pointer already exists at ${pointerPath}`);
    process.exit(1);
  }

  const worktreePath = path.join(worktreesDir, taskSlug);
  if (fs.existsSync(worktreePath)) {
    console.error(`Error: Worktree path already exists at ${worktreePath}`);
    process.exit(1);
  }

  const rootBranch = readProjectRootBranch();
  const baseRef = rootBranch;

  if (branchExists(branchName)) {
    console.error(`Error: Branch ${branchName} already exists locally. Please choose a new branch name.`);
    process.exit(1);
  }

  try {
    fs.mkdirSync(worktreesDir, { recursive: true });
    console.log(`Creating worktree at ${worktreePath} from ${baseRef}...`);
    runGitCommand(`git worktree add -b ${branchName} "${worktreePath}" ${baseRef}`, rootDir);
  } catch (error) {
    console.error('Error creating git worktree and branch.');
    process.exit(1);
  }

  const taskDir = path.join(worktreePath, 'docs', 'agent-tasks', taskSlug);
  const memoryDir = path.join(taskDir, 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  const taskYamlPath = path.join(taskDir, 'task.yaml');
  const initialTaskYaml = `name: "${taskName}"
description: ""
branch: "${branchName}"
phase: "planning"
owner: ""
dependencies: []
implementation: []
tests: []
`;
  fs.writeFileSync(taskYamlPath, initialTaskYaml);

  const pointerContent = `branch: "${branchName}"
priority: ${priority}
created: "${today.toISOString().slice(0, 10)}"
`;
  fs.writeFileSync(pointerPath, pointerContent);
  runGitCommand(`git add "${pointerPath}"`, agenticCodingDir);
  runGitCommand(`git commit -m "Create task: ${taskSlug}"`, agenticCodingDir);
  runGitCommand(`git push origin`, agenticCodingDir);

  console.log(`\nCreated pointer: .agentic-coding/tasks/${taskSlug}.yaml`);
  console.log(`Created worktree: worktrees/${taskSlug}`);
  console.log(`Created task folder: worktrees/${taskSlug}/docs/agent-tasks/${taskSlug}/`);
  console.log(`Created initial task.yaml: worktrees/${taskSlug}/docs/agent-tasks/${taskSlug}/task.yaml`);
  console.log(`\nNext steps:`);
  console.log(`1. Navigate to the task worktree: cd worktrees/${taskSlug}`);
  console.log(`2. Edit task.yaml to add a description, owner, and any known dependencies.`);
  console.log(`3. Begin the planning phase by following the workflow in .agentic-coding/skills/managing-task-lifecycle/SKILL.md`);
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
