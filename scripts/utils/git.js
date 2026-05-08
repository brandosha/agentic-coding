const { execSync } = require('child_process');
const { agenticCodingDir } = require('./paths');

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
}