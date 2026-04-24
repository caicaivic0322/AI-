import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdmissionPlanContext,
  enrichReportWithAdmissionPlans,
  findMatchingAdmissionPlan,
} from '../app/lib/admission-plans.mjs';

const samplePlans = [
  {
    year: 2026,
    province: '浙江',
    batch: '本科普通批',
    school_code: '10335',
    school_name: '浙江大学',
    major_group: '专业组001',
    major_code: '080901',
    major_name: '计算机科学与技术',
    subject_requirement: '物理+化学',
    plan_count: 4,
    source_name: '浙江省教育考试院',
    source_url: 'https://example.edu/zhejiang-2026-plan',
    published_at: '2026-06-20',
  },
  {
    year: 2026,
    province: '江苏',
    batch: '本科普通批',
    school_name: '浙江大学',
    major_group: '专业组001',
    major_name: '计算机科学与技术',
    subject_requirement: '物理+化学',
    plan_count: 3,
  },
  {
    year: 2026,
    province: '浙江',
    batch: '本科普通批',
    school_name: '浙江大学',
    major_group: '专业组002',
    major_name: '法学',
    subject_requirement: '历史',
    plan_count: 2,
  },
];

test('findMatchingAdmissionPlan matches school major province year and subject requirement', () => {
  const match = findMatchingAdmissionPlan(
    {
      province: '浙江',
      subject_type: '物理类（物理+化学+生物）',
      exam_year: 2026,
    },
    {
      school: '浙江大学',
      major: '计算机科学与技术',
    },
    samplePlans
  );

  assert.equal(match.school_name, '浙江大学');
  assert.equal(match.major_name, '计算机科学与技术');
  assert.equal(match.plan_count, 4);
  assert.equal(match.source_name, '浙江省教育考试院');
});

test('findMatchingAdmissionPlan does not match another province or incompatible subject', () => {
  const provinceMiss = findMatchingAdmissionPlan(
    {
      province: '浙江',
      subject_type: '物理类（物理+化学+生物）',
      exam_year: 2026,
    },
    {
      school: '南京大学',
      major: '计算机科学与技术',
    },
    samplePlans
  );

  const subjectMiss = findMatchingAdmissionPlan(
    {
      province: '浙江',
      subject_type: '物理类',
      exam_year: 2026,
    },
    {
      school: '浙江大学',
      major: '法学',
    },
    samplePlans
  );

  assert.equal(provinceMiss, null);
  assert.equal(subjectMiss, null);
});

test('enrichReportWithAdmissionPlans annotates matched plans and source notes', () => {
  const report = enrichReportWithAdmissionPlans(
    {
      province: '浙江',
      subject_type: '物理+化学+生物',
      exam_year: 2026,
    },
    {
      plans: [
        {
          type: '冲刺',
          school: '浙江大学',
          major: '计算机科学与技术',
          admission_rate: '中',
        },
      ],
      source_notes: {
        summary: '已有来源',
        items: [],
        data_gaps: [],
      },
      final_notes: {},
    },
    samplePlans
  );

  assert.equal(report.plans[0].admission_plan_match.status, 'matched');
  assert.equal(report.plans[0].admission_plan_match.plan_count, 4);
  assert.equal(report.plans[0].admission_plan_match.year, 2026);
  assert.match(report.plans[0].reason, /2026 浙江本科普通批招生计划/);
  assert.equal(report.source_notes.items[0].category, '招生计划');
  assert.equal(report.final_notes.data_to_verify, '已优先匹配 2026 年招生计划；正式填报前仍请以省考试院和院校最新公布版本为准。');
});

test('buildAdmissionPlanContext summarizes imported official plans for the prompt', () => {
  const context = buildAdmissionPlanContext(
    {
      province: '浙江',
      subject_type: '物理+化学+生物',
      exam_year: 2026,
    },
    samplePlans
  );

  assert.match(context, /已导入的 2026 招生计划/);
  assert.match(context, /浙江大学/);
  assert.match(context, /计划 4 人/);
  assert.doesNotMatch(context, /江苏/);
});
