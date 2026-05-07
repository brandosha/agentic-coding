const path = require('path');
const { execSync } = require('child_process');
const { parseJsonFile } = require('./task-files');
const { z } = require('zod');

const rootDir = path.resolve(__dirname, '..', '..');
const agenticCodingDir = path.join(rootDir, '.agentic-coding');
const configDir = path.join(agenticCodingDir, 'config');
const tasksDir = path.join(agenticCodingDir, 'tasks');
const worktreesDir = path.join(rootDir, 'worktrees');

const personalConfigSchema = z.object({
  name: z.string(),
});

function readPersonalConfig() {
  const personalConfigPath = path.join(configDir, 'personal-config.json');
  if (!fs.existsSync(personalConfigPath)) {
    throw new Error('Error: personal-config.json not found at .agentic-coding/config/personal-config.json.');
  }
  
  const personalConfig = personalConfigSchema.parse(parseJsonFile(personalConfigPath));
  

  return personalConfig;
}

const projectConfigSchema = z.object({
  git: z.object({
    root_branch: z.string(),
    branch_naming: z.string()
  }),
});

function readProjectConfig() {
  const projectConfigPath = path.join(configDir, 'project-config.json');
  if (!fs.existsSync(projectConfigPath)) {
    throw new Error('Error: project-config.json not found at .agentic-coding/config/project-config.json.');
  }

  const projectConfig = projectConfigSchema.parse(parseJsonFile(projectConfigPath));

  return projectConfig;
}

module.exports = {
  rootDir,
  agenticCodingDir,
  tasksDir,
  worktreesDir,
  agenticCodingBranch: {
    pull(stdio = 'inherit') {
      execSync('git pull --rebase origin', { cwd: agenticCodingDir, stdio });
    },
    commit(msg, stdio = 'inherit') {
      execSync('git add .', { cwd: agenticCodingDir, stdio });
      execSync(`git commit -m "${msg}"`, { cwd: agenticCodingDir, stdio });
    },
    push(stdio = 'inherit') {
      execSync('git push origin', { cwd: agenticCodingDir, stdio });
    },
  },
  readPersonalConfig,
  readProjectConfig,
}