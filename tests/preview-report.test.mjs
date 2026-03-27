import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreviewReport } from '../app/lib/preview-report.mjs';

test('buildPreviewReport creates a full report structure from form data', () => {
  const report = buildPreviewReport({
    province: '浙江',
    score: '618',
    rank: '15234',
    subject_type: '物理类',
    target_city: '上海、杭州',
    school_preference: '双一流',
    decision_maker: '家长',
    path_priority: ['优先就业', '考研深造'],
  });

  assert.equal(report.student_summary.includes('浙江'), true);
  assert.equal(report.family_summary.includes('家长'), true);
  assert.equal(Array.isArray(report.plans), true);
  assert.equal(report.plans.length > 0, true);
  assert.equal(Array.isArray(report.employment_trends.items), true);
  assert.equal(typeof report.final_notes.next_steps, 'string');
});
