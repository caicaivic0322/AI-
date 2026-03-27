import { getReport } from '../../../lib/db';
import { handleGetReportRequest } from '../../../lib/api/report-handler.mjs';

export async function GET(request, { params }) {
  return handleGetReportRequest(request, { params }, { getReport });
}
