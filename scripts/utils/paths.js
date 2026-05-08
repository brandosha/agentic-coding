const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../../..');
const agenticCodingDir = path.join(rootDir, '.agentic-coding');
const configDir = path.join(agenticCodingDir, 'config');
const tasksDir = path.join(agenticCodingDir, 'tasks');
const worktreesDir = path.join(rootDir, 'worktrees');

module.exports = {
  rootDir,
  agenticCodingDir,
  configDir,
  tasksDir,
  worktreesDir,
}