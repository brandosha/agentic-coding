const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const agenticCodingDir = path.join(rootDir, '.agentic-coding');
const tasksDir = path.join(agenticCodingDir, 'tasks');
const worktreesDir = path.join(rootDir, 'worktrees');

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
}