import { jsonResponse } from './response-utils.mjs';

const REQUIRED_FIELDS = ['province', 'score', 'rank', 'subject_type', 'decision_maker'];

export async function handleGenerateReportRequest(request, dependencies) {
  const {
    createId,
    createReport,
    updateReportContent,
    generateReport,
    runInBackground = (task) => {
      queueMicrotask(() => {
        task().catch((error) => {
          console.error('Generate background job error:', error);
        });
      });
    },
  } = dependencies;

  try {
    const formData = await request.json();

    for (const field of REQUIRED_FIELDS) {
      if (!formData[field]) {
        return jsonResponse({ error: `缺少必填字段: ${field}` }, { status: 400 });
      }
    }

    const reportId = createId();
    createReport(reportId, formData);

    runInBackground(async () => {
      const reportContent = await generateReport(formData);
      updateReportContent(reportId, reportContent);
    });

    return jsonResponse({
      success: true,
      reportId,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return jsonResponse(
      { error: error.message || '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}
