const { execSync } = require('child_process');
const { agenticCodingDir, rootDir } = require('./paths');

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

function runGitCommand(command, cwd = rootDir) {
  return execSync(command, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      GIT_EDITOR: 'true',
    }
  });
}

module.exports = {
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
  branchExists,
  remoteBranchExists,
  runGitCommand,
}