import test from 'node:test';
import assert from 'node:assert/strict';

import { enrichAdmissionRates, inferAdmissionRate } from '../app/lib/admission-utils.mjs';

test('inferAdmissionRate uses historical rank snippets when available', () => {
  const admissionRate = inferAdmissionRate(
    { rank: '27000', score: '563' },
    { type: '稳妥', school: '西安邮电大学', major: '电子信息工程' },
    [
      {
        results: [
          {
            title: '西安邮电大学电子信息工程 2024 年陕西录取位次',
            content: '2024 年最低位次 28910，最低分 560 分。',
          },
          {
            title: '西安邮电大学电子信息工程 2023 年陕西录取数据',
            content: '2023 年录取位次 27620，对应最低分 557 分。',
          },
        ],
      },
    ]
  );

  assert.equal(admissionRate, '中高');
});

test('enrichAdmissionRates replaces review placeholder with inferred labels', () => {
  const report = enrichAdmissionRates(
    { rank: '27000', score: '563' },
    {
      plans: [
        {
          type: '冲刺',
          school: '西安理工大学',
          major: '法学',
          admission_rate: '需历史数据复核',
        },
        {
          type: '保底',
          school: '成都理工大学',
          major: '经济学',
          admission_rate: '',
        },
      ],
    },
    []
  );

  assert.equal(report.plans[0].admission_rate, '中低');
  assert.equal(report.plans[1].admission_rate, '高');
});
