const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile, taskSchema } = require('./utils/tasks');
const { tasksDir, rootDir } = require('./utils/paths');
const { readPersonalConfig } = require('./utils/config');

function loadPointerFiles() {
  if (!fs.existsSync(tasksDir)) {
    console.log('No tasks directory found.');
    return [];
  }

  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const id = file.replace(/\.json$/, '');

    try {
      const pointer = readPointerFile(path.join(tasksDir, file));
      return { id, file, ...pointer };
    } catch (e) {
      return { id, file, error: e };
    }
  });
}

function fetchTaskJson(branch, id) {
  const taskPath = `docs/agent-tasks/${id}/task.json`;
  const content = execSync(`git cat-file -p ${branch}:${taskPath} 2>/dev/null`, {
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  return taskSchema.parse(JSON.parse(content));
}

function taskHasBlocker(branch, taskId) {
  try {
    const blockerPath = `docs/agent-tasks/${taskId}/BLOCKER.md`;
    execSync(`git cat-file -e ${branch}:${blockerPath}`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    return true;
  } catch (e) {
    return false;
  }
}

function fetchTaskBlocker(branch, id) {
  try {
    const blockerPath = `docs/agent-tasks/${id}/BLOCKER.md`;
    const content = execSync(`git cat-file -p ${branch}:${blockerPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return content;
  } catch (e) {
    console.error(`Error fetching blocker for ${id} from branch ${branch}: ${e.message}`);
    return null;
  }
}

function main() {
  const personalConfig = readPersonalConfig();
  const pointers = loadPointerFiles();

  if (pointers.length === 0) {
    console.log('No tasks found.');
    return;
  }

  const affectedFiles = new Map();

  const tasksByPhase = {
    'planning': [],
    'test-authoring': [],
    'development': [],
    'verification': [],
    'done': [],
  };
  const blocked = [];

  const taskData = {};

  for (const p of pointers) {
    const task = {
      id: p.id,
      pointer: p
    };
    taskData[p.id] = task;

    if (p.error) {
      console.error(`Error reading pointer file ${p.file}: ${p.error.message}`);
      continue;
    }

    if (p.completed) {
      task.phase = 'done';
      tasksByPhase.done.push(task);
      continue;
    }

    try {
      execSync(`git fetch origin ${branch}`, { stdio: 'pipe' }); // Ensure we have the branch locally
    } catch (e) {
      task.fetchError = e;
    }

    if (taskHasBlocker(p.branch, p.id)) {
      const blockerContent = fetchTaskBlocker(p.branch, p.id);
      task.blocker = blockerContent;
      blocked.push(task);
      continue;
    }

    try {
      const taskJson = fetchTaskJson(p.branch, p.id);
      const { phase } = taskJson;
      task.phase = phase;
      task.json = taskJson;
      tasksByPhase[phase].push(task);
      
      const testsWritten = taskJson.tests.reduce((count, test) => count + (test.written ? 1 : 0), 0);

      for (const impl of taskJson.implementation) {
        const fileTasks = affectedFiles.get(impl.file) || new Set();
        fileTasks.add(task);
        affectedFiles.set(impl.file, fileTasks);
      }
    } catch (e) {
      task.jsonError = e;
    }
  }

  console.log(`Tasks (${Object.keys(taskData).length}):`);
  console.log(`Current workspace owner: ${personalConfig.name}`);

  console.log(`\nblocked (${blocked.length}):`);
  for (const task of blocked) {
    console.log(`\n${task.id}`);
    console.log(`priority: ${task.pointer.priority}`);
    console.log(`branch: ${task.pointer.branch}`);
    if (task.fetchError) {
      console.error(`> Error fetching task branch: ${task.fetchError.message}`);
      console.error('> Task info may be outdated.\n');
    }

    console.log(`Blocker:\n${task.blocker}\n`);
  }

  const phases = ['planning', 'test-authoring', 'development', 'verification'];
  const phaseIndices = {};
  phases.forEach((p, i) => phaseIndices[p] = i);

  for (const phase of phases) {
    const tasks = tasksByPhase[phase];
    console.log(`\n${phase} (${tasks.length}):`);
    for (const task of tasks) {
      console.log(`\n${task.id}`);
      console.log(`priority: ${task.pointer.priority}`);
      console.log(`branch: ${task.pointer.branch}`);
      if (task.fetchError) {
        console.error(`> Error fetching task branch: ${task.fetchError.message}`);
        console.error('> Task info may be outdated.');
      }

      if (task.jsonError) {
        console.error(`> Error reading task.json: ${task.jsonError.message}`);
        continue;
      }

      console.log(`name: ${task.json.name}`);
      console.log(`description: ${task.json.description}`);
      console.log(`owner: ${task.json.owner}`);
      
      if (phase === 'planning') {
        console.log(`changes planned: ${task.json.implementation.length}`);
        console.log(`tests planned: ${task.json.tests.length}`);
      } else if (phase === 'test-authoring') {
        const testsWritten = task.json.tests.reduce((count, test) => count + (test.written ? 1 : 0), 0);
        console.log(`tests written: ${testsWritten}/${task.json.tests.length}`);
      } else if (phase === 'development') {
        const implCompleted = task.json.implementation.reduce((count, impl) => count + (impl.complete ? 1 : 0), 0);
        console.log(`changes completed: ${implCompleted}/${task.json.implementation.length}`);
      } else if (phase === 'verification') {
        const implCompleted = task.json.implementation.reduce((count, impl) => count + (impl.complete ? 1 : 0), 0);
        const testsWritten = task.json.tests.reduce((count, test) => count + (test.written ? 1 : 0), 0);
        console.log(`changes completed: ${implCompleted}/${task.json.implementation.length}`);
        console.log(`tests written: ${testsWritten}/${task.json.tests.length}`);
      }

      const fileConflicts = [];
      for (const impl of task.json.implementation) {
        const fileTasks = affectedFiles.get(impl.file);
        if (!fileTasks || fileTasks.size <= 1) {
          continue;
        }

        const conflictingTasks = Array.from(fileTasks).filter(t => phaseIndices[t.phase] > phaseIndices[phase]);
        if (conflictingTasks.length === 0) {
          continue;
        }
        
        fileConflicts.push({
          file: impl.file,
          tasks: conflictingTasks,
        });
      }

      if (fileConflicts.length > 0) {
        console.log(`potential file conflicts:`);
        for (const conflict of fileConflicts) {
          const conflictingTasks = conflict.tasks.map(t => `${t.id} (${t.phase})`).join(', ');
          console.log(`- ${conflict.file} [${conflictingTasks}]`);
        }
      }
    }
  }

  console.log(`\ndone (${tasksByPhase.done.length}):`);
  for (const task of tasksByPhase.done) {
    console.log(`\n${task.id}`);
  }
}

main();
