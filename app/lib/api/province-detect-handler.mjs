import { jsonResponse } from './response-utils.mjs';

export async function handleDetectProvinceRequest(request, dependencies) {
  const {
    detectProvince,
  } = dependencies;

  try {
    const province = await detectProvince(request);
    return jsonResponse({ province: province || null });
  } catch (error) {
    console.error('Province detect error:', error);
    return jsonResponse({ province: null });
  }
}
