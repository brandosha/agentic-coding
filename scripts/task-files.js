const fs = require('fs');
const { z } = require('zod');

const taskPhases = [
  'planning',
  'test-authoring',
  'development',
  'verification',
  'done',
];

const implementationSchema = z.object({
  complete: z.boolean().optional(),
  file: z.string(),
  target: z.string(),
  action: z.string(),
  description: z.string(),
});

const testSchema = z.object({
  written: z.boolean().optional(),
  file: z.string(),
  type: z.string(),
  targets: z.array(z.string()),
  description: z.string(),
});

const taskSchema = z.object({
  name: z.string(),
  description: z.string(),
  branch: z.string(),
  phase: z.enum(taskPhases),
  completed: z.iso.datetime().pipe(z.coerce.date()).optional(),
  owner: z.string(),
  dependencies: z.array(z.string()),
  tests: z.array(testSchema),
  implementation: z.array(implementationSchema),
});

const pointerSchema = z.object({
  branch: z.string(),
  priority: z.number().int().min(1).max(10),
  created: z.string(),
  completed: z.string().optional(),
});

const orders = {
  pointer: [
    'branch',
    'priority',
    'created',
    'completed',
  ],
  task: [
    'name',
    'description',
    'branch',
    'phase',
    'completed',
    'owner',
    'dependencies',
    'tests',
    'implementation',
  ],
  implementation: [
    'complete',
    'file',
    'target',
    'action',
    'description'
  ],
  test: [
    'written',
    'file',
    'type',
    'description',
    'targets',
  ],
};

function parseJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse JSON at ${filePath}: ${error.message}`);
  }
}

function orderObject(value, preferredOrder = []) {
  if (Array.isArray(value)) {
    return value.map(item => orderObject(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const ordered = {};
  const keys = new Set(Object.keys(value));
  for (const key of preferredOrder) {
    if (keys.has(key)) {
      ordered[key] = orderNestedValue(key, value[key]);
      keys.delete(key);
    }
  }

  for (const key of Array.from(keys).sort()) {
    ordered[key] = orderNestedValue(key, value[key]);
  }

  return ordered;
}

function orderNestedValue(key, value) {
  if (key === 'implementation') {
    return value.map(item => orderObject(item, orders.implementation));
  }

  if (key === 'tests') {
    return value.map(item => orderObject(item, orders.test));
  }

  return orderObject(value);
}

function formatJson(value, preferredOrder) {
  return `${JSON.stringify(orderObject(value, preferredOrder), null, 2)}\n`;
}

function readTaskFile(taskPath) {
  return taskSchema.parse(parseJsonFile(taskPath));
}

function writeTaskFile(taskPath, task) {
  fs.writeFileSync(taskPath, formatJson(taskSchema.parse(task), orders.task));
}

function readPointerFile(pointerPath) {
  return pointerSchema.parse(parseJsonFile(pointerPath));
}

function writePointerFile(pointerPath, pointer) {
  fs.writeFileSync(pointerPath, formatJson(pointerSchema.parse(pointer), orders.pointer));
}

module.exports = {
  orders,
  pointerSchema,
  taskSchema,
  formatJson,
  normalizeTaskFields,
  parseJsonFile,
  readPointerFile,
  readTaskFile,
  writePointerFile,
  writeTaskFile,
};
