const fs = require('fs');
const path = require('path');

function nextTaskId() {
  const tasksDir = path.join(__dirname, '..',);
  const taskFiles = fs.globSync('*/*/task.yaml', { cwd: tasksDir });
  const taskIds = taskFiles.map(file => parseInt(file.split('/')[1].split('-')[0], 10));
  console.log('Existing task files:', taskFiles, taskIds);

  let maxId = 0;
  for (const id of taskIds) {
    if (!isNaN(id) && id > maxId) {
      maxId = id;
    }
  }

  return String(maxId + 1).padStart(4, '0');
}

function createTask(taskName, priority) {
  const taskId = nextTaskId();
  const taskFolder = `${taskId}_${taskName.replace(/\W+/g, '-').toLowerCase()}`;
  const taskPhase = '0-backlog'; // Default phase for new tasks
  const taskPath = path.join(__dirname, '..', taskPhase, taskFolder);
  fs.mkdirSync(taskPath, { recursive: true });

  const taskYamlContent = `id: "${taskId}"
name: "${taskName}"
description: ""
branch: ""
priority: ${priority}
owner: ""
dependencies: []
files: []
`;
  fs.writeFileSync(path.join(taskPath, 'task.yaml'), taskYamlContent);

  const readmeContent = `# ${taskName}\n\n`;
  fs.writeFileSync(path.join(taskPath, 'README.md'), readmeContent);

  const progressContent = `# Progress Log
  
[${new Date().toISOString()}] Task created and added to \`${taskPhase}\`.
`;
  fs.writeFileSync(path.join(taskPath, 'PROGRESS.md'), progressContent);

  fs.mkdirSync(path.join(taskPath, 'memory'), { recursive: true });

  console.log(`Created new task in ${taskPhase}/${taskFolder}`);
}

const taskName = process.argv[2];
if (!taskName) {
  console.error('Please provide a task name as the first argument.');
  process.exit(1);
}

const priority = process.argv[3];
if (!priority || isNaN(priority) || priority < 1 || priority > 10) {
  console.error('Please provide a valid priority (1-10) as the second argument.');
  process.exit(1);
}

createTask(taskName, priority);