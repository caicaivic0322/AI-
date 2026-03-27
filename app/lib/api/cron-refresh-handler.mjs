import { jsonResponse } from './response-utils.mjs';

export async function handleRefreshHomepageNewsCronRequest(request, dependencies) {
  const {
    secret = '',
    refreshHomepageNews,
  } = dependencies;

  try {
    if (!secret) {
      console.error('CRON_SECRET is not configured');
      return jsonResponse({ error: '未配置定时刷新密钥' }, { status: 500 });
    }

    const authorization = request.headers.get('authorization') || '';
    if (authorization !== `Bearer ${secret}`) {
      return jsonResponse({ error: '未授权' }, { status: 401 });
    }

    const items = await refreshHomepageNews();
    const sources = [...new Set(items.map((item) => item.source).filter(Boolean))];

    return jsonResponse({
      success: true,
      refreshedCount: items.length,
      sources,
    });
  } catch (error) {
    console.error('Homepage news cron refresh failed:', error);
    return jsonResponse({ error: '刷新首页新闻失败' }, { status: 500 });
  }
}
