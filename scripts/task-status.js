const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const tasksDir = path.resolve(__dirname, '..', '..', '..', 'tasks');

function loadPointerFiles() {
  if (!fs.existsSync(tasksDir)) {
    console.log('No tasks directory found.');
    return [];
  }

  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.yaml'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
    const pointer = yaml.load(content);
    const slug = file.replace('.yaml', '');
    return { slug, file, ...pointer };
  });
}

function fetchTaskYaml(branch, slug) {
  try {
    const taskPath = `docs/agent-tasks/${slug}/task.yaml`;

    execSync(`git fetch origin ${branch}`, { stdio: 'ignore' }); // Ensure we have the branch locally
    const content = execSync(`git --no-pager show ${branch}:${taskPath} 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return yaml.load(content);
  } catch (e) {
    console.error(`Error fetching task.yaml for ${slug} from branch ${branch}: ${e.message}`);
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
  const completed = pointers.filter(p => p.completed);

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

      const taskYaml = fetchTaskYaml(task.branch, task.slug);
      const phase = taskYaml ? (taskYaml.phase || 'unknown') : '(no task.yaml)';
      console.log(
        task.slug.padEnd(40) +
        phase.padEnd(18) +
        String(task.priority || '-').padEnd(10) +
        task.branch
      );
    }
  }

  if (completed.length > 0) {
    console.log(`\n=== Completed Tasks (${completed.length}) ===\n`);
    for (const task of completed) {
      console.log(`  ${task.slug}  (completed: ${task.completed})`);
    }
  }
}

main();
