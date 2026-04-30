const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function init() {
  const directories = [
    '0-backlog',
    '1-discovery',
    '2-planned',
    '3-test-authoring',
    '4-development',
    '5-review',
    '6-verification',
    '7-done',
    '8-blocked'
  ];

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
      console.log(`Created directory: ${dir}`);
    }
  }

  console.log('Running npm install in scripts directory...');
  execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
}

init().catch(err => {
  console.error('Error initializing config:', err);
});