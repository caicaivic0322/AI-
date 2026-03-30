export function shouldPollReport(report) {
  return Boolean(report) && report.status === 'pending' && !report.report;
}

export function getReportViewState({ loading, error, report }) {
  if (loading) {
    return {
      kind: 'loading',
      title: '加载报告中...',
      detail: '',
    };
  }

  if (error) {
    return {
      kind: 'error',
      title: error,
      detail: '',
    };
  }

  if (report?.status === 'failed') {
    return {
      kind: 'failed',
      title: '报告生成失败',
      detail: report.error_message || '生成过程中出现异常，请稍后重试。',
    };
  }

  if (!report || !report.report) {
    return {
      kind: 'pending',
      title: '报告正在生成中...',
      detail: '系统正在持续获取最新进度，请稍候片刻。',
    };
  }

  return {
    kind: 'ready',
    title: '',
    detail: '',
  };
}
