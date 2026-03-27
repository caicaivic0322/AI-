import { detectProvinceFromIpService } from '../../../lib/province-detect.mjs';
import { handleDetectProvinceRequest } from '../../../lib/api/province-detect-handler.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleDetectProvinceRequest(request, {
    detectProvince: () => detectProvinceFromIpService(),
  });
}
