import { after } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createReport, markReportPaid, updateReportContent, updateReportStatus } from '../../lib/db';
import { generateReport } from '../../lib/ai';
import { handleGenerateReportRequest } from '../../lib/api/generate-handler.mjs';
import { buildPreviewReport } from '../../lib/preview-report.mjs';

export async function POST(request) {
  return handleGenerateReportRequest(request, {
    createId: uuidv4,
    createReport,
    updateReportContent,
    updateReportStatus,
    markReportPaid,
    generateReport,
    runInBackground: after,
    previewMode: process.env.PREVIEW_MODE === 'true',
    buildPreviewReport,
  });
}
