import { jsonResponse } from './response-utils.mjs';
import { buildConciseReportHtml, buildFullReportHtml } from '../report-pdf.mjs';
import { sanitizeReportForUserDisplay } from '../report-presentation.mjs';

const VALID_MODES = new Set(['concise', 'full']);

export async function handleDownloadReportPdfRequest(request, { params }, dependencies) {
  const { getReport, renderPdf } = dependencies;

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'concise';

    if (!VALID_MODES.has(mode)) {
      return jsonResponse({ error: '无效的导出模式' }, { status: 400 });
    }

    const report = getReport(id);
    if (!report) {
      return jsonResponse({ error: '报告不存在' }, { status: 404 });
    }

    if (!report.paid) {
      return jsonResponse({ error: '请先付费解锁完整报告后再下载' }, { status: 403 });
    }

    if (!report.report_content) {
      return jsonResponse({ error: '报告内容尚未生成完成' }, { status: 409 });
    }

    const payload = {
      created_at: report.created_at,
      report: sanitizeReportForUserDisplay(report.report_content),
    };
    const html = mode === 'concise' ? buildConciseReportHtml(payload) : buildFullReportHtml(payload);
    const pdfBuffer = await renderPdf(html);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gaokao-report-${mode}-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Report pdf download error:', error);
    return jsonResponse({ error: '导出 PDF 失败' }, { status: 500 });
  }
}
