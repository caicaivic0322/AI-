import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('generate route uses Next after() for background generation scheduling', () => {
  const filePath = path.join(process.cwd(), 'app', 'api', 'generate', 'route.js');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /import\s+\{\s*after\s*\}\s+from\s+'next\/server'/);
  assert.match(source, /runInBackground:\s*after/);
});
