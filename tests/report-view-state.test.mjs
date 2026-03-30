import test from 'node:test';
import assert from 'node:assert/strict';

import { getReportViewState, shouldPollReport } from '../app/lib/report-view-state.mjs';

test('returns pending state while report content is still being generated', () => {
  const state = getReportViewState({
    loading: false,
    error: '',
    report: {
      status: 'pending',
      error_message: null,
      report: null,
    },
  });

  assert.deepEqual(state, {
    kind: 'pending',
    title: '报告正在生成中...',
    detail: '系统正在持续获取最新进度，请稍候片刻。',
  });
});

test('returns failed state with backend error message', () => {
  const state = getReportViewState({
    loading: false,
    error: '',
    report: {
      status: 'failed',
      error_message: 'AI 服务暂时不可用',
      report: null,
    },
  });

  assert.deepEqual(state, {
    kind: 'failed',
    title: '报告生成失败',
    detail: 'AI 服务暂时不可用',
  });
});

test('returns ready state once report content exists', () => {
  const state = getReportViewState({
    loading: false,
    error: '',
    report: {
      status: 'success',
      error_message: null,
      report: {
        student_summary: 'ok',
      },
    },
  });

  assert.deepEqual(state, {
    kind: 'ready',
    title: '',
    detail: '',
  });
});

test('polling is enabled only for pending reports without content', () => {
  assert.equal(shouldPollReport({ status: 'pending', report: null }), true);
  assert.equal(shouldPollReport({ status: 'failed', report: null }), false);
  assert.equal(shouldPollReport({ status: 'success', report: { student_summary: 'ok' } }), false);
});
