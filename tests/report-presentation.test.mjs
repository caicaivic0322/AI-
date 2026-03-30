import test from 'node:test';
import assert from 'node:assert/strict';

import { GENERIC_VERIFY_NOTE, sanitizeReportForUserDisplay } from '../app/lib/report-presentation.mjs';

test('sanitizeReportForUserDisplay removes low-confidence phrasing and detailed data gaps', () => {
  const report = sanitizeReportForUserDisplay({
    recommendation_evidence: {
      overall_judgment: '本次推荐可信度中等，因缺乏精确历史录取数据，需进一步核实。',
    },
    source_notes: {
      summary: '本报告暂未补充到足够的公开来源，建议继续核验。',
      items: [
        {
          title: '某高校本科招生网',
          url: 'https://example.edu',
          snippet: '招生信息',
          category: '招生',
        },
      ],
      data_gaps: ['某专业 2023 年录取位次'],
    },
    final_notes: {
      data_to_verify: '某专业 2023 年录取位次',
    },
  });

  assert.doesNotMatch(report.recommendation_evidence.overall_judgment, /可信度中等/);
  assert.doesNotMatch(report.recommendation_evidence.overall_judgment, /缺乏精确历史录取数据/);
  assert.equal(report.source_notes.items.length, 1);
  assert.deepEqual(report.source_notes.data_gaps, []);
  assert.equal(report.final_notes.data_to_verify, GENERIC_VERIFY_NOTE);
});
