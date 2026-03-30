import { jsonResponse } from './response-utils.mjs';

const REQUIRED_FIELDS = ['province', 'score', 'rank', 'subject_type', 'decision_maker'];

export async function handleGenerateReportRequest(request, dependencies) {
  const {
    createId,
    createReport,
    updateReportContent,
    updateReportStatus = () => {},
    generateReport,
    previewMode = false,
    buildPreviewReport,
    markReportPaid,
    createPreviewOrderNo = () => `PREVIEW_ORDER_${Date.now()}`,
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
    updateReportStatus(reportId, 'pending', null);

    if (previewMode) {
      const reportContent = buildPreviewReport(formData);
      updateReportContent(reportId, reportContent);
      updateReportStatus(reportId, 'success', null);

      if (markReportPaid) {
        markReportPaid(reportId, createPreviewOrderNo(reportId));
      }

      return jsonResponse({
        success: true,
        reportId,
        preview: true,
      });
    }

    runInBackground(async () => {
      try {
        const reportContent = await generateReport(formData);
        updateReportContent(reportId, reportContent);
        updateReportStatus(reportId, 'success', null);
      } catch (error) {
        updateReportStatus(reportId, 'failed', error.message || '生成失败，请稍后重试');
        throw error;
      }
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
