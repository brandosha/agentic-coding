const fs = require('fs');
const { z } = require('zod');

const { parseJsonFile, formatJson } = require('./json');

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

function readTaskFile(taskPath) {
  return taskSchema.parse(parseJsonFile(taskPath));
}

function taskKeyOrder(keyPath) {
  if (keyPath.length === 0) {
    return orders.task;
  } else if (keyPath[0] === 'tests') {
    return orders.test;
  } else if (keyPath[0] === 'implementation') {
    return orders.implementation;
  } else {
    return [];
  }
}

function writeTaskFile(taskPath, task) {
  fs.writeFileSync(taskPath, formatJson(taskSchema.parse(task), taskKeyOrder));
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
  parseJsonFile,
  readPointerFile,
  readTaskFile,
  writePointerFile,
  writeTaskFile,
};
