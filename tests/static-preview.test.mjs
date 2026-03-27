import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const STATIC_PREVIEW_DIR = path.join(process.cwd(), 'static-preview');

function readStaticFile(name) {
  return fs.readFileSync(path.join(STATIC_PREVIEW_DIR, name), 'utf8');
}

test('static preview site contains core pages', () => {
  const requiredFiles = [
    'index.html',
    'form.html',
    'report.html',
    'styles.css',
    'preview-data.js',
  ];

  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.join(STATIC_PREVIEW_DIR, file)), true);
  }
});

test('static preview homepage links to form page', () => {
  const html = readStaticFile('index.html');
  assert.equal(html.includes('href="./form.html"'), true);
});

test('static preview form links to report page', () => {
  const html = readStaticFile('form.html');
  assert.equal(html.includes('data-preview-submit'), true);
});

test('static preview report renders preview marker', () => {
  const html = readStaticFile('report.html');
  assert.equal(html.includes('前端静态预览'), true);
});
