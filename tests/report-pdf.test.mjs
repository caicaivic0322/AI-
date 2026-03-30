import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildConciseReportHtml,
  buildFullReportHtml,
} from '../app/lib/report-pdf.mjs';
import { handleDownloadReportPdfRequest } from '../app/lib/api/report-pdf-handler.mjs';

test('buildConciseReportHtml includes volunteer table content', () => {
  const html = buildConciseReportHtml({
    created_at: '2026-03-29 12:00:00',
    report: {
      concise_report: {
        summary: '建议优先稳妥志愿。',
        volunteer_table: [
          {
            priority: '本科普通批 第1志愿',
            school: '浙江工业大学',
            major: '软件工程',
            fill_strategy: '稳妥',
            note: '主力志愿',
          },
        ],
      },
    },
  });

  assert.match(html, /简明版志愿表/);
  assert.match(html, /志愿填报执行单/);
  assert.match(html, /row-gap:\s*18px/);
  assert.match(html, /浙江工业大学/);
  assert.match(html, /本科普通批 第1志愿/);
});

test('buildFullReportHtml includes evidence sections', () => {
  const html = buildFullReportHtml({
    created_at: '2026-03-29 12:00:00',
    report: {
      student_summary: '学生总结',
      family_summary: '家庭总结',
      strategy: {
        core: '核心策略',
        not_recommended: '不推荐方向',
        uncertainties: '不确定项',
      },
      plans: [
        {
          type: '稳妥',
          school: '浙江工业大学',
          major: '软件工程',
          admission_rate: '中高',
          undergrad_employment: '本科就业方向',
          grad_employment: '读研后方向',
          civil_service_friendly: '中高',
          soe_fit: '高',
          grad_boost: '中高',
          reason: '推荐理由',
          risk: '风险提示',
          alternative: '替代方案',
        },
      ],
      family_concerns: {
        civil_service: '考公建议',
        graduate_school: '考研建议',
        soe_opportunity: '国企建议',
        location_advice: '城市建议',
      },
      recommendation_evidence: {
        overall_judgment: '判断依据充分。',
        factors: [
          {
            title: '位次匹配',
            analysis: '分析内容',
            evidence: '证据内容',
            conclusion: '结论内容',
          },
        ],
        school_major_rationales: [],
      },
      source_notes: {
        summary: '综合参考招生章程、录取信息与就业质量报告。',
        items: [
          {
            title: '浙江工业大学本科招生网',
            url: 'https://example.edu/zs',
            snippet: '包含招生章程与历年录取说明。',
            category: '招生',
          },
        ],
        data_gaps: [],
      },
      employment_trends: {
        overview: '就业总览判断',
        items: [
          {
            plan_type: '稳妥',
            school: '浙江工业大学',
            major: '软件工程',
            trend_verdict: '稳中向好',
            trend_window: '未来3-5年',
            demand_signal: '企业数字化需求稳定',
            sector_direction: '软件开发、实施、产品支持',
            regional_fit: '长三角匹配度高',
            risk_note: '竞争强度提升',
            advice: '优先积累项目经历',
          },
        ],
        action_summary: '优先选择就业出口稳定的城市与专业组合。',
      },
      final_notes: {
        data_to_verify: '需核实信息',
        scope: '适用范围',
        next_steps: '下一步动作',
      },
    },
  });

  assert.match(html, /全面版分析报告/);
  assert.match(html, /执行摘要/);
  assert.match(html, /关键判断/);
  assert.match(html, /推荐策略/);
  assert.match(html, /推荐方案详解/);
  assert.match(html, /未来就业方向与趋势指导/);
  assert.match(html, /家长关注问题/);
  assert.match(html, /参考来源/);
  assert.match(html, /最终提醒/);
  assert.match(html, /判断依据充分/);
  assert.match(html, /位次匹配/);
  assert.match(html, /企业数字化需求稳定/);
  assert.match(html, /浙江工业大学本科招生网/);
  assert.doesNotMatch(html, /待补充核验/);
});

test('download report pdf rejects invalid mode', async () => {
  const response = await handleDownloadReportPdfRequest(
    new Request('http://localhost:3000/api/report/abc/pdf?mode=other'),
    { params: { id: 'abc' } },
    {
      getReport: () => ({
        id: 'abc',
        paid: 1,
        created_at: '2026-03-29 12:00:00',
        report_content: { concise_report: { volunteer_table: [] } },
      }),
      renderPdf: async () => Buffer.from('pdf'),
    }
  );

  assert.equal(response.status, 400);
});

test('download report pdf rejects unpaid reports', async () => {
  const response = await handleDownloadReportPdfRequest(
    new Request('http://localhost:3000/api/report/abc/pdf?mode=concise'),
    { params: { id: 'abc' } },
    {
      getReport: () => ({
        id: 'abc',
        paid: 0,
      }),
      renderPdf: async () => Buffer.from('pdf'),
    }
  );

  assert.equal(response.status, 403);
});

test('download report pdf returns attachment for concise mode', async () => {
  const response = await handleDownloadReportPdfRequest(
    new Request('http://localhost:3000/api/report/abc/pdf?mode=concise'),
    { params: { id: 'abc' } },
    {
      getReport: () => ({
        id: 'abc',
        paid: 1,
        created_at: '2026-03-29 12:00:00',
        report_content: {
          concise_report: {
            summary: 'summary',
            volunteer_table: [],
          },
        },
      }),
      renderPdf: async (html) => {
        assert.match(html, /简明版志愿表/);
        return Buffer.from('pdf');
      },
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition') || '', /gaokao-report-concise-abc\.pdf/);
});
