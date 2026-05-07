const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { readPointerFile, taskSchema } = require('./task-files');
const { tasksDir } = require('./utils');

function loadPointerFiles() {
  if (!fs.existsSync(tasksDir)) {
    console.log('No tasks directory found.');
    return [];
  }

  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const pointer = readPointerFile(path.join(tasksDir, file));
    const slug = file.replace('.json', '');
    return { slug, file, ...pointer };
  });
}

function fetchTaskJson(branch, slug) {
  try {
    const taskPath = `docs/agent-tasks/${slug}/task.json`;

    execSync(`git fetch origin ${branch}`, { stdio: 'ignore' }); // Ensure we have the branch locally
    const content = execSync(`git --no-pager show ${branch}:${taskPath} 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return taskSchema.parse(JSON.parse(content));
  } catch (e) {
    console.error(`Error fetching task.json for ${slug} from branch ${branch}: ${e.message}`);
    return null;
  }
}

function fetchTaskBlocker(branch, slug) {
  try {
    const blockerPath = `docs/agent-tasks/${slug}/BLOCKER.md`;
    const content = execSync(`git --no-pager show ${branch}:${blockerPath} 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return content;
  } catch (e) {
    console.error(`Error fetching blocker for ${slug} from branch ${branch}: ${e.message}`);
    return null;
  }
}

function main() {
  const pointers = loadPointerFiles();

  if (pointers.length === 0) {
    console.log('No tasks found.');
    return;
  }

  const active = pointers.filter(p => !p.completed);
  const done = pointers.filter(p => p.completed);

  if (active.length > 0) {
    // Sort by priority (highest first)
    active.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log('=== Active Tasks ===\n');
    console.log(
      'Slug'.padEnd(40) +
      'Phase'.padEnd(18) +
      'Priority'.padEnd(10) +
      'Branch'
    );
    console.log('-'.repeat(100));

    for (const task of active) {
      if (!task.branch) {
        console.log(
          task.slug.padEnd(40) +
          'backlog'.padEnd(18) +
          String(task.priority || '-').padEnd(10) +
          '(no branch yet)'
        );
        continue;
      }

      const taskJson = fetchTaskJson(task.branch, task.slug);
      const phase = taskJson ? (taskJson.phase || 'unknown') : '(no task.json)';
      console.log(
        task.slug.padEnd(40) +
        phase.padEnd(18) +
        String(task.priority || '-').padEnd(10) +
        task.branch
      );
    }
  }

  if (done.length > 0) {
    console.log(`\n=== Done Tasks (${done.length}) ===\n`);
    for (const task of done) {
      console.log(`  ${task.slug}  (completed: ${task.completed})`);
    }
  }
}

main();
