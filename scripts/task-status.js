const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile, taskSchema } = require('./utils/tasks');
const { tasksDir, rootDir } = require('./utils/paths');
const { readPersonalConfig, readProjectConfig } = require('./utils/config');

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

function fetchTaskBlocker(branch, taskId) {
  try {
    const blockerPath = `docs/agent-tasks/${taskId}/BLOCKER.md`;
    const content = execSync(`git cat-file -p ${branch}:${blockerPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return content;
  } catch (e) {
    console.error(`Error fetching blocker for ${taskId} from branch ${branch}: ${e.message}`);
    return null;
  }
}

function countTestingStats(taskJson) {
  let planned = 0;
  let written = 0;

  for (const group of taskJson.testing) {
    planned += group.tests.length;
    for (const test of group.tests) {
      if (test.written) {
        written += 1;
      }
    }
  }

  return { planned, written };
}

function main() {
  const projectConfig = readProjectConfig();
  const personalConfig = readPersonalConfig();
  const pointers = loadPointerFiles();

  if (pointers.length === 0) {
    console.log('No tasks found.');
    return;
  }

  execSync(`git fetch origin ${projectConfig.git.rootBranch}`, { stdio: 'ignore' });

  const affectedFiles = new Map();

  const tasksByPhase = {
    'planning': [],
    'test-authoring': [],
    'development': [],
    'done': [],

    'unmerged': [],
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

    // if (p.completed) {
    //   task.phase = 'done';
    //   tasksByPhase.done.push(task);
    //   continue;
    // }

    try {
      execSync(`git fetch origin ${p.branch}`, { stdio: 'pipe' }); // Ensure we have the branch locally
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
      const taskJson = fetchTaskJson(`origin/${p.branch}`, p.id);
      task.json = taskJson;

      const { phase } = taskJson;
      if (phase === 'done') {
        try {
          const rootTaskJson = fetchTaskJson(`origin/${projectConfig.git.rootBranch}`, p.id);
          if (rootTaskJson.phase !== 'done') {
            task.rootBranchPhase = rootTaskJson.phase;
            throw new Error(`Task ${p.id} is marked done in branch ${p.branch} but is in phase "${rootTaskJson.phase}" in root branch ${projectConfig.git.rootBranch}`);
          }

          task.phase = 'done';
          tasksByPhase.done.push(task);
          continue;
        } catch (e) {
          task.phase = 'unmerged';
          tasksByPhase.unmerged.push(task);
          continue;
        }
      }

      task.phase = phase;
      tasksByPhase[phase].push(task);

      for (const impl of taskJson.implementation) {
        const fileTasks = affectedFiles.get(impl.file) || new Set();
        fileTasks.add(task);
        affectedFiles.set(impl.file, fileTasks);
      }
    } catch (e) {
      task.jsonError = e;
      blocked.push(task);
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

    if (task.jsonError) {
      console.error(`> Error reading task.json: ${task.jsonError.message}`);
      continue;
    }

    if (task.blocker) {
      console.log(`Blocker:\n${task.blocker}\n`);
    }
  }

  const phases = ['planning', 'test-authoring', 'development', 'unmerged'];
  const phaseIndices = {};
  phases.forEach((p, i) => phaseIndices[p] = i);

  for (const phase of phases) {
    const tasks = tasksByPhase[phase];
    console.log(`\n${phase} (${tasks.length}):`);
    for (const task of tasks) {
      console.log(`\n${task.id}`);
      console.log(`priority: ${task.pointer.priority}`);
      console.log(`dependencies: [${task.json.dependencies.join(', ')}]`);
      console.log(`branch: ${task.pointer.branch}`);
      if (task.fetchError) {
        console.error(`> Error fetching task branch: ${task.fetchError.message}`);
        console.error('> Task info may be outdated.');
      }

      console.log(`name: ${task.json.name}`);
      console.log(`description: ${task.json.description}`);
      console.log(`owner: ${task.json.owner}`);

      let plannedChanges = 0;
      let implementedChanges = 0;
      let approvedChanges = 0;
      for (const impl of task.json.implementation) {
        plannedChanges += impl.changes.length;
        for (const change of impl.changes) {
          if (change.implemented) {
            implementedChanges += 1;
            if (change.reviewStatus === 'approved') {
              approvedChanges += 1;
            }
          }
        }
      }

      const { planned: plannedTests, written: testsWritten } = countTestingStats(task.json);
      
      if (phase === 'planning') {
        console.log(`changes planned: ${plannedChanges}`);
        console.log(`tests planned: ${plannedTests}`);
      } else if (phase === 'test-authoring') {
        console.log(`tests written: ${testsWritten}/${plannedTests}`);
      } else if (phase === 'development') {
        console.log(`changes implemented: ${implementedChanges}/${plannedChanges}`);
        console.log(`changes approved: ${approvedChanges}/${implementedChanges}`);
      } else if (phase === 'unmerged') {
          console.log(`Task is marked done in branch ${task.pointer.branch} but has not been merged to root branch ${projectConfig.git.rootBranch}`);
          if (task.rootBranchPhase) {
            console.log(`> Current phase in root branch ${projectConfig.git.rootBranch}: ${task.rootBranchPhase}`);
          }
      }

      const fileConflicts = [];
      for (const impl of task.json.implementation) {
        const fileTasks = affectedFiles.get(impl.file);
        if (!fileTasks || fileTasks.size <= 1) {
          continue;
        }

        const conflictingTasks = Array.from(fileTasks).filter(
          t => t.id !== task.id && phaseIndices[t.phase] >= phaseIndices[phase]
        );
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
