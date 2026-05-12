const fs = require('fs');
const { z } = require('zod');

const { parseJsonFile, formatJson } = require('./json');

const taskPhases = [
  'planning',
  'test-authoring',
  'development',
  'done',
];

const implementationChangeSchema = z.object({
  target: z.string(),
  description: z.string(),
  implemented: z.boolean().optional(),
  reviewStatus: z.enum(['none', 'approved', 'rejected']).optional(),
  reviewFeedback: z.array(z.string()).optional(),
});

const implementationSchema = z.object({
  file: z.string(),
  changes: z.array(implementationChangeSchema),
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
  implementation: z.array(implementationSchema),
  tests: z.array(testSchema),
});

const pointerSchema = z.object({
  branch: z.string(),
  priority: z.number().int().min(1).max(10),
  created: z.string(),
  completed: z.iso.datetime().pipe(z.coerce.date()).optional(),
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
    'implementation',
    'tests',
  ],
  implementation: [
    'file',
    'changes',
  ],
  change: [
    'target',
    'description',
    'implemented',
    'reviewStatus',
    'reviewFeedback',
  ],
  test: [
    'written',
    'file',
    'type',
    'description',
    'targets',
  ],
};

function taskKeyOrder(keyPath) {
  if (keyPath.length === 0) {
    return orders.task;
  } else if (keyPath[0] === 'tests') {
    return orders.test;
  } else if (keyPath[0] === 'implementation') {
    if (keyPath.includes('changes')) {
      return orders.change;
    }
    return orders.implementation;
  } else {
    return [];
  }
}

function readTaskFile(taskPath) {
  return taskSchema.parse(parseJsonFile(taskPath));
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
