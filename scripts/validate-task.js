const fs = require('fs');
const path = require('path');
const { ZodError } = require('zod');

const {
  tasksDir,
  worktreesDir,
} = require('./utils/paths');
const {
  readPointerFile,
  readTaskFile,
  writePointerFile,
  writeTaskFile,
} = require('./utils/tasks');

function reportValidationError(error) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      console.error(`- ${field}: ${issue.message}`);
    }
    return;
  }

  console.error(error.message);
}

function main(taskId) {
  const taskPath = path.join(worktreesDir, taskId, 'docs', 'agent-tasks', taskId, 'task.json');
  if (!fs.existsSync(taskPath)) {
    console.error(`Error: task.json not found for task ID "${taskId}". Expected at: ${taskPath}`);
    process.exit(1);
  }

  try {
    const task = readTaskFile(taskPath);
    writeTaskFile(taskPath, task);
    console.log(`Validated and formatted task.json for ${taskId}.`);

    const pointerPath = path.join(tasksDir, `${taskId}.json`);
    if (fs.existsSync(pointerPath)) {
      const pointer = readPointerFile(pointerPath);
      writePointerFile(pointerPath, pointer);
      console.log(`Validated and formatted pointer file for ${taskId}.`);
    }
  } catch (error) {
    console.error(`Error: Validation failed for ${taskId}.`);
    reportValidationError(error);
    process.exit(1);
  }
}

const taskId = process.argv[2];

if (!taskId) {
  console.error('Error: Missing task ID argument. Usage: node validate-task.js {taskId}');
  process.exit(1);
}

main(taskId);
