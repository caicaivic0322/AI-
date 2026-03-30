import test from 'node:test';
import assert from 'node:assert/strict';

import { handleGenerateReportRequest } from '../app/lib/api/generate-handler.mjs';
import { handleGetReportRequest } from '../app/lib/api/report-handler.mjs';
import { handlePayCreateRequest } from '../app/lib/api/pay-create-handler.mjs';
import { handlePayNotifyRequest } from '../app/lib/api/pay-notify-handler.mjs';
import { handleRefreshHomepageNewsCronRequest } from '../app/lib/api/cron-refresh-handler.mjs';

function createJsonRequest(url, body, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  return response.json();
}

function createGetRequest(url, headers = {}) {
  return new Request(url, {
    method: 'GET',
    headers,
  });
}

async function withMutedConsoleError(run) {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = originalConsoleError;
  }
}

test('/api/generate returns 400 when required fields are missing', async () => {
  const response = await handleGenerateReportRequest(
    createJsonRequest('http://localhost:3000/api/generate', {
      province: '浙江',
      score: '650',
    }),
    {}
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), { error: '缺少必填字段: rank' });
});

test('/api/generate returns reportId after saving generated content', async () => {
  const calls = [];
  let finishGeneration;
  const response = await handleGenerateReportRequest(
    createJsonRequest('http://localhost:3000/api/generate', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }),
    {
      createId: () => 'report-test-id',
      createReport: (id, formData) => calls.push(['create', id, formData]),
      generateReport: () => new Promise((resolve) => {
        finishGeneration = () => resolve({ student_summary: 'ok' });
      }),
      updateReportContent: (id, content) => calls.push(['update', id, content]),
      updateReportStatus: (id, status, errorMessage = null) => calls.push(['status', id, status, errorMessage]),
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    reportId: 'report-test-id',
  });
  assert.deepEqual(calls, [
    ['create', 'report-test-id', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }],
    ['status', 'report-test-id', 'pending', null],
  ]);

  await Promise.resolve();
  finishGeneration();
  await Promise.resolve();
  assert.deepEqual(calls, [
    ['create', 'report-test-id', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }],
    ['status', 'report-test-id', 'pending', null],
    ['update', 'report-test-id', { student_summary: 'ok' }],
    ['status', 'report-test-id', 'success', null],
  ]);
});

test('/api/generate marks report as failed when background generation throws', async () => {
  const calls = [];
  const response = await withMutedConsoleError(() =>
    handleGenerateReportRequest(
      createJsonRequest('http://localhost:3000/api/generate', {
        province: '浙江',
        score: '650',
        rank: '8000',
        subject_type: '物理类',
        decision_maker: '家长',
      }),
      {
        createId: () => 'report-failed-id',
        createReport: (id, formData) => calls.push(['create', id, formData]),
        generateReport: async () => {
          throw new Error('AI 服务暂时不可用');
        },
        updateReportContent: (id, content) => calls.push(['update', id, content]),
        updateReportStatus: (id, status, errorMessage = null) => calls.push(['status', id, status, errorMessage]),
        runInBackground: async (task) => {
          await task().catch(() => {});
        },
      }
    )
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    reportId: 'report-failed-id',
  });

  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(calls, [
    ['create', 'report-failed-id', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }],
    ['status', 'report-failed-id', 'pending', null],
    ['status', 'report-failed-id', 'failed', 'AI 服务暂时不可用'],
  ]);
});

test('/api/generate stores a full preview report immediately in preview mode', async () => {
  const calls = [];
  const response = await handleGenerateReportRequest(
    createJsonRequest('http://localhost:3000/api/generate', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }),
    {
      previewMode: true,
      createId: () => 'preview-report-id',
      createReport: (id, formData) => calls.push(['create', id, formData]),
      updateReportContent: (id, content) => calls.push(['update', id, content]),
      markReportPaid: (id, orderNo) => calls.push(['paid', id, orderNo]),
      buildPreviewReport: () => ({
        student_summary: '预览报告',
        plans: [],
      }),
      createPreviewOrderNo: () => 'PREVIEW_ORDER_1',
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    reportId: 'preview-report-id',
    preview: true,
  });
  assert.deepEqual(calls, [
    ['create', 'preview-report-id', {
      province: '浙江',
      score: '650',
      rank: '8000',
      subject_type: '物理类',
      decision_maker: '家长',
    }],
    ['update', 'preview-report-id', {
      student_summary: '预览报告',
      plans: [],
    }],
    ['paid', 'preview-report-id', 'PREVIEW_ORDER_1'],
  ]);
});

test('/api/report/[id] masks sensitive fields for unpaid reports', async () => {
  const response = await handleGetReportRequest(
    new Request('http://localhost:3000/api/report/report-1'),
    { params: { id: 'report-1' } },
    {
      getReport: () => ({
        id: 'report-1',
        paid: 0,
        amount: 999,
        status: 'success',
        error_message: null,
        created_at: '2026-03-27 10:00:00',
        form_data: { province: '浙江' },
        report_content: {
          concise_report: {
            summary: '适合以稳妥志愿为主。',
            volunteer_table: [
              {
                priority: '本科普通批 第1志愿',
                school: '浙江大学',
                major: '计算机科学与技术',
                fill_strategy: '冲刺',
                note: '建议放在高位志愿。',
              },
            ],
          },
          student_summary: '总结',
          family_summary: '家庭',
          strategy: { core: '核心', not_recommended: '不推荐', uncertainties: '不确定' },
          plans: [{
            type: '稳妥',
            school: '浙江大学',
            major: '计算机',
            admission_rate: '中高',
            civil_service_friendly: '高',
            soe_fit: '高',
            grad_boost: '高',
          }],
          family_concerns: {},
          recommendation_evidence: {
            overall_judgment: '推荐依据充分。',
            factors: [
              {
                title: '位次匹配',
                analysis: '符合近年录取区间。',
                evidence: '参考往年位次波动。',
                conclusion: '可作为重点志愿。',
              },
            ],
            school_major_rationales: [
              {
                school: '浙江大学',
                major: '计算机科学与技术',
                rationale: '学校平台强，专业出口稳定。',
                evidence: '行业需求与城市资源支撑较强。',
                risk_balance: '需接受更高竞争强度。',
              },
            ],
          },
          source_notes: {
            summary: '综合参考了招生章程和就业质量报告。',
            items: [
              {
                title: '浙江大学本科招生章程',
                url: 'https://example.edu/zs',
                snippet: '说明选考要求与录取规则。',
                category: '招生',
              },
            ],
            data_gaps: ['具体专业录取位次仍需复核'],
          },
          employment_trends: { items: [] },
          final_notes: {},
        },
      }),
    }
  );

  const payload = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(payload.paid, false);
  assert.equal(payload.status, 'success');
  assert.equal(payload.error_message, null);
  assert.equal(payload.report.concise_report.volunteer_table[0].school, '***付费后查看***');
  assert.equal(payload.report.recommendation_evidence.overall_judgment, '付费后查看...');
  assert.equal(payload.report.plans[0].school, '***付费后查看***');
  assert.equal(payload.report.strategy.not_recommended, '付费后查看');
  assert.equal(payload.report.source_notes.summary, '付费后查看...');
  assert.equal(payload.report.source_notes.items[0].title, '***付费后查看***');
});

test('/api/report/[id] returns failed generation state without masked content', async () => {
  const response = await handleGetReportRequest(
    new Request('http://localhost:3000/api/report/report-failed'),
    { params: { id: 'report-failed' } },
    {
      getReport: () => ({
        id: 'report-failed',
        paid: 0,
        amount: 999,
        status: 'failed',
        error_message: 'AI 服务暂时不可用',
        created_at: '2026-03-27 10:00:00',
        form_data: { province: '浙江' },
        report_content: null,
      }),
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    id: 'report-failed',
    paid: false,
    amount: 999,
    status: 'failed',
    error_message: 'AI 服务暂时不可用',
    created_at: '2026-03-27 10:00:00',
    form_data: { province: '浙江' },
    report: null,
  });
});

test('/api/pay/notify marks report as paid in dev mode', async () => {
  const marked = [];
  const response = await handlePayNotifyRequest(
    createJsonRequest('http://localhost:3000/api/pay/notify', { reportId: 'report-2' }),
    {
      secret: '',
      markReportPaid: (reportId, orderNo) => marked.push([reportId, orderNo]),
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { success: true });
  assert.equal(marked[0][0], 'report-2');
  assert.match(marked[0][1], /^DEV_ORDER_/);
});

test('/api/pay/notify rejects invalid signed callbacks', async () => {
  const response = await withMutedConsoleError(() =>
    handlePayNotifyRequest(
      createJsonRequest('http://localhost:3000/api/pay/notify', {
        attach: 'report-3',
        trade_order_id: 'order-3',
        status: 'OD',
        hash: 'invalid',
      }),
      {
        secret: 'test-secret',
        markReportPaid: () => {
          throw new Error('should not be called');
        },
      }
    )
  );

  assert.equal(response.status, 400);
  assert.equal(await response.text(), 'fail');
});

test('/api/pay/create returns 400 when reportId is missing', async () => {
  const response = await handlePayCreateRequest(
    createJsonRequest('http://localhost:3000/api/pay/create', {}),
    {}
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), { error: '缺少报告ID' });
});

test('/api/pay/create returns dev mode payload when payment credentials are absent', async () => {
  const response = await handlePayCreateRequest(
    createJsonRequest('http://localhost:3000/api/pay/create', {
      reportId: 'report-4',
      payType: 'wechat',
    }),
    {
      appId: '',
      secret: '',
      getReport: () => ({
        id: 'report-4',
        paid: 0,
        amount: 999,
      }),
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    dev_mode: true,
    message: '开发模式：请调用 /api/pay/notify 模拟支付成功',
    reportId: 'report-4',
  });
});

test('/api/pay/create posts signed order to XunhuPay when credentials exist', async () => {
  let capturedRequest;
  const response = await handlePayCreateRequest(
    createJsonRequest(
      'http://localhost:3000/api/pay/create',
      { reportId: 'report-5', payType: 'alipay' },
      { host: 'example.com' }
    ),
    {
      appId: 'app-123',
      secret: 'secret-456',
      now: () => 1710000000000,
      createNonce: () => 'nonce-123',
      getReport: () => ({
        id: 'report-5',
        paid: 0,
        amount: 1999,
      }),
      fetchImpl: async (url, options) => {
        capturedRequest = { url, options };
        return new Response(JSON.stringify({ errcode: 0, url_qrcode: 'https://pay.example/qr' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    }
  );

  const payload = await readJson(response);
  const submitted = JSON.parse(capturedRequest.options.body);

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.payUrl, 'https://pay.example/qr');
  assert.equal(payload.orderNo, 'GK1710000000000');
  assert.equal(capturedRequest.url, 'https://api.xunhupay.com/payment/do.html');
  assert.equal(submitted.type, 'alipay');
  assert.equal(submitted.notify_url, 'https://example.com/api/pay/notify');
  assert.equal(submitted.return_url, 'https://example.com/report/report-5');
  assert.equal(submitted.total_fee, '19.99');
  assert.equal(submitted.nonce_str, 'nonce-123');
  assert.ok(submitted.hash);
});

test('/api/cron/refresh-homepage-news rejects unauthorized requests', async () => {
  const response = await handleRefreshHomepageNewsCronRequest(
    createGetRequest('http://localhost:3000/api/cron/refresh-homepage-news', {
      authorization: 'Bearer wrong-secret',
    }),
    {
      secret: 'cron-secret',
      refreshHomepageNews: async () => {
        throw new Error('should not be called');
      },
    }
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await readJson(response), { error: '未授权' });
});

test('/api/cron/refresh-homepage-news refreshes cache when authorized', async () => {
  let called = false;
  const response = await handleRefreshHomepageNewsCronRequest(
    createGetRequest('http://localhost:3000/api/cron/refresh-homepage-news', {
      authorization: 'Bearer cron-secret',
    }),
    {
      secret: 'cron-secret',
      refreshHomepageNews: async () => {
        called = true;
        return [
          { source: '教育部', title: '政策 1' },
          { source: '阳光高考', title: '政策 2' },
          { source: '教育部', title: '政策 3' },
        ];
      },
    }
  );

  assert.equal(response.status, 200);
  assert.equal(called, true);
  assert.deepEqual(await readJson(response), {
    success: true,
    refreshedCount: 3,
    sources: ['教育部', '阳光高考'],
  });
});
