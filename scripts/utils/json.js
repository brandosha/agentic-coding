const fs = require('fs');

function parseJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse JSON at ${filePath}: ${error.message}`);
  }
}

/**
 * @typedef { string[] | (keyPath: string[]) => string[] } KeyOrder
 */

/**
 * Orders the keys of an object according to a preferred order.
 * @template T
 * @param { T } value 
 * @param { KeyOrder } preferredOrder 
 * @returns { T }
 */
function orderObject(value, preferredOrder = [], _keyPath = []) {
  if (Array.isArray(value)) {
    return value.map((item, i) => orderObject(item, preferredOrder, [..._keyPath, i]));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const order = typeof preferredOrder === 'function' ? preferredOrder(_keyPath) : preferredOrder;

  const ordered = {};
  for (const key of order) {
    if (key in value) {
      ordered[key] = orderObject(value[key], preferredOrder, [..._keyPath, key]);
    }
  }

  for (const key of Object.keys(value)) {
    if (key in ordered) continue;
    ordered[key] = orderObject(value[key], preferredOrder, [..._keyPath, key]);
  }

  return ordered;
}

/**
 * Formats a value as a JSON string with keys ordered according to a preferred order.
 * @param { any } value 
 * @param { KeyOrder } preferredOrder 
 * @returns { string }
 */
function formatJson(value, preferredOrder) {
  return `${JSON.stringify(orderObject(value, preferredOrder), null, 2)}\n`;
}

module.exports = {
  parseJsonFile,
  orderObject,
  formatJson,
};